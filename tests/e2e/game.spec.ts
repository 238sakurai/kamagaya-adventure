import { test, expect, type Page } from '@playwright/test'

/** 地図上のピンを ID で特定し、キーボードで確定する（位置ずれの影響を受けない） */
async function tapPin(page: Page, id: string) {
  const pin = page.locator(`[data-testid="kamagaya-map"] [data-pin="${id}"]`)
  await expect(pin).toBeVisible()
  await pin.focus()
  await page.keyboard.press('Enter')
}

async function startMode(page: Page, mode: 'school' | 'district' | 'facility' | 'challenge', seed = 1, extraQuery = '') {
  await page.goto(`./?seed=${seed}${extraQuery}`)
  await page.getByTestId('play-button').click()
  await page.getByTestId(`mode-${mode}`).click()
  await expect(page.getByTestId('quiz-screen')).toBeVisible()
}

test.describe('title and navigation', () => {
  test('shows the title screen and opens how-to, zukan, settings and about', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: /かまがや大冒険/ })).toBeVisible()
    await expect(page.getByTestId('play-button')).toBeEnabled()
    await page.getByTestId('howto-button').click()
    await expect(page.getByTestId('howto-screen')).toBeVisible()
    await page.getByTestId('back-button').click()
    await page.getByTestId('zukan-button').click()
    await expect(page.getByTestId('zukan-screen')).toBeVisible()
    await expect(page.getByTestId('discovered-count')).toContainText('0')
    await page.getByTestId('back-button').click()
    await page.getByTestId('settings-button').click()
    await expect(page.getByTestId('settings-screen')).toBeVisible()
    await page.getByTestId('back-button').click()
    await page.getByTestId('about-button').click()
    await expect(page.getByTestId('about-screen')).toBeVisible()
    await expect(page.getByTestId('about-screen')).toContainText('非公式')
  })

  test('loads static assets from the base path (GitHub Pages sub path)', async ({ page, baseURL }) => {
    const failed: string[] = []
    page.on('response', (res) => {
      if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`)
    })
    await page.goto('./')
    await expect(page.getByTestId('kamagaya-map')).toBeVisible()
    expect(failed).toEqual([])
    const geoResponse = await page.request.get(`${baseURL}data/geo/kamagaya.json`)
    expect(geoResponse.ok()).toBe(true)
  })
})

test.describe('school quiz', () => {
  test('answers correctly with confirm, shows feedback, and reaches the result after 10 questions', async ({ page }) => {
    await startMode(page, 'school')
    const seen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const question = page.getByTestId('question')
      await expect(question.getByTestId('question-text')).toContainText(`Q${i + 1}`)
      const target = (await question.getAttribute('data-target'))!
      expect(seen.has(target)).toBe(false)
      seen.add(target)
      await tapPin(page, target)
      await page.getByTestId('confirm-button').click()
      const feedback = page.getByTestId('feedback')
      await expect(feedback).toBeVisible()
      await expect(feedback).toContainText('だいせいかい')
      await expect(feedback.getByTestId('trivia')).toBeVisible()
      await expect(page.locator(`[data-pin="${target}"]`)).toHaveAttribute('data-style', 'correct')
      await page.getByTestId('next-button').click()
    }
    await expect(page.getByTestId('result-screen')).toBeVisible()
    await expect(page.getByTestId('stat-correct')).toContainText('10')
    await expect(page.getByTestId('rank-title')).toContainText('かまがやマスター')
    await expect(page.getByTestId('new-record')).toBeVisible()
  })

  test('shows the correct place after a wrong answer, and the hint highlights the town', async ({ page }) => {
    await startMode(page, 'school', 5)
    const target = (await page.getByTestId('question').getAttribute('data-target'))!
    await page.getByTestId('hint-button').click()
    await expect(page.getByTestId('hint-text')).toContainText('という町に あるよ')
    await expect(page.locator('path[data-style="hint"]')).toHaveCount(1)
    const wrong = target === 'es-tobu' ? 'es-nanbu' : 'es-tobu'
    await tapPin(page, wrong)
    await page.getByTestId('confirm-button').click()
    const feedback = page.getByTestId('feedback')
    await expect(feedback).toHaveAttribute('data-correct', 'false')
    await expect(feedback).toContainText('せいかいは')
    await expect(page.locator(`[data-pin="${target}"]`)).toHaveAttribute('data-style', 'correct')
    await expect(page.locator(`[data-pin="${wrong}"]`)).toHaveAttribute('data-style', 'wrong')
    await expect(page.getByTestId('score')).toContainText('0')
  })

  test('elementary filter gives 9 unique questions', async ({ page }) => {
    await page.goto('./?seed=3')
    await page.getByTestId('play-button').click()
    await page.getByTestId('filter-elementary').click()
    await page.getByTestId('mode-school').click()
    await expect(page.locator('[data-testid="kamagaya-map"] [data-pin]')).toHaveCount(9)
    await expect(page.getByRole('progressbar', { name: /9もん中/ })).toBeVisible()
  })

  test('the list picker is an alternative to tapping pins', async ({ page }) => {
    await startMode(page, 'school', 7)
    const target = (await page.getByTestId('question').getAttribute('data-target'))!
    await page.getByTestId('list-pick-button').click()
    await page.locator(`[data-pin-list="${target}"]`).click()
    await page.getByTestId('confirm-button').click()
    await expect(page.getByTestId('feedback')).toContainText('だいせいかい')
  })
})

test.describe('district quiz', () => {
  test('answers 4-choice questions and shows an explanation on a miss', async ({ page }) => {
    await startMode(page, 'district', 3)
    await expect(page.locator('path[data-style="target"]')).toHaveCount(1)
    const target = (await page.getByTestId('question').getAttribute('data-target'))!
    await page.locator(`[data-testid="choices"] button[data-code="${target}"]`).click()
    await expect(page.getByTestId('feedback')).toContainText('だいせいかい')
    await page.getByTestId('next-button').click()

    const second = (await page.getByTestId('question').getAttribute('data-target'))!
    await page.getByTestId('hint-button').click()
    await expect(page.locator('[data-testid="choices"] button:disabled')).toHaveCount(2)
    const wrong = page.locator(`[data-testid="choices"] button:not([data-code="${second}"]):not(:disabled)`).first()
    await wrong.click()
    const feedback = page.getByTestId('feedback')
    await expect(feedback).toContainText('おしい')
    await expect(feedback).toContainText('せいかいは')
    await expect(page.locator('path[data-style="wrong"]')).toHaveCount(1)
    await expect(page.locator('path[data-style="correct"]')).toHaveCount(1)
  })
})

test.describe('facility quiz', () => {
  test('shows the facility description and official link after a correct answer', async ({ page }) => {
    await startMode(page, 'facility', 2)
    await expect(page.locator('[data-testid="kamagaya-map"] [data-pin]')).toHaveCount(12)
    const target = (await page.getByTestId('question').getAttribute('data-target'))!
    await tapPin(page, target)
    await page.getByTestId('confirm-button').click()
    const feedback = page.getByTestId('feedback')
    await expect(feedback).toContainText('だいせいかい')
    await expect(feedback.getByTestId('trivia')).toBeVisible()
    const link = feedback.getByTestId('feedback-official-link')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await feedback.getByTestId('feedback-zukan-button').click()
    await expect(page.getByTestId('zukan-screen')).toBeVisible()
    await expect(page.getByTestId('entry-detail')).toHaveAttribute('data-id', target)
    // 図鑑から戻ってもクイズが続く
    await page.getByTestId('detail-close').click()
    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('quiz-screen')).toBeVisible()
    await expect(page.getByTestId('feedback')).toBeVisible()
  })
})

test.describe('challenge mode', () => {
  test('shows a timer, pauses while hidden, and finishes with a result when time runs out', async ({ page }) => {
    await startMode(page, 'challenge', 2, '&timeLimit=6')
    await expect(page.getByTestId('timer')).toContainText('6')
    const question = page.getByTestId('question')
    const kind = await question.getAttribute('data-kind')
    const target = (await question.getAttribute('data-target'))!
    if (kind === 'choice') await page.locator(`[data-testid="choices"] button[data-code="${target}"]`).click()
    else await tapPin(page, target)
    await expect(page.getByTestId('feedback')).toBeVisible()
    await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: 12_000 })
    await expect(page.getByTestId('stat-correct')).toContainText('1')
  })

  test('the timer stops while the tab is hidden', async ({ page }) => {
    await startMode(page, 'challenge', 4, '&timeLimit=30')
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page.getByTestId('paused')).toBeVisible()
    const before = await page.getByTestId('timer').textContent()
    await page.waitForTimeout(1500)
    expect(await page.getByTestId('timer').textContent()).toBe(before)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page.getByTestId('paused')).toHaveCount(0)
  })
})

test.describe('exploration and encyclopedia', () => {
  test('discovers a facility and a district, registers them in the zukan, and keeps them after reload', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('explore-button').click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
    await expect(page.getByTestId('explore-count')).toContainText('0/57')
    await tapPin(page, 'library-main')
    await expect(page.getByTestId('discovery-banner')).toBeVisible()
    await expect(page.getByTestId('entry-detail')).toHaveAttribute('data-id', 'library-main')
    await expect(page.getByTestId('official-link')).toHaveAttribute('href', /library-kamagaya-chiba\.jp/)
    await page.keyboard.press('Escape')
    const district = page.locator('[data-testid="kamagaya-map"] path[data-district="town-0300"]')
    await district.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('entry-detail')).toHaveAttribute('data-id', 'town-0300')
    await expect(page.getByTestId('entry-name')).toContainText('新鎌ケ谷')
    await page.getByTestId('discovery-zukan-button').click()
    await expect(page.getByTestId('zukan-screen')).toBeVisible()
    await page.getByTestId('detail-close').click()
    await expect(page.getByTestId('discovered-count')).toContainText('2')
    await expect(page.locator('[data-testid="zukan-card"][data-id="town-0300"]')).toHaveAttribute('data-discovered', 'true')

    await page.reload()
    await page.getByTestId('zukan-button').click()
    await expect(page.getByTestId('discovered-count')).toContainText('2')
    await expect(page.getByTestId('complete-rate')).toContainText('4%')
  })

  test('undiscovered entries hide the name but still offer the official link', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('zukan-button').click()
    const card = page.locator('[data-testid="zukan-card"][data-id="es-tobu"]')
    await expect(card).toHaveAttribute('data-discovered', 'false')
    await expect(card).toContainText('？？？')
    await card.click()
    const detail = page.getByTestId('entry-detail')
    await expect(detail).toHaveAttribute('data-discovered', 'false')
    await expect(detail.getByTestId('entry-description')).toHaveCount(0)
    const link = detail.getByTestId('official-link')
    await expect(link).toHaveAttribute('href', 'https://swa.kamagaya.ed.jp/swas/index.php?id=102')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    // 町名には公式リンクのボタンを出さない
    await page.getByTestId('detail-close').click()
    await page.getByTestId('tab-district').click()
    await page.locator('[data-testid="zukan-card"][data-id="town-0020"]').click()
    await expect(page.getByTestId('entry-detail').getByTestId('official-link')).toHaveCount(0)
  })

  test('opening an official link in a new tab keeps the game state', async ({ page, context }) => {
    await page.goto('./')
    await page.getByTestId('explore-button').click()
    await tapPin(page, 'center-awano')
    const [popup] = await Promise.all([context.waitForEvent('page'), page.getByTestId('official-link').click()])
    await popup.close()
    await expect(page.getByTestId('entry-detail')).toHaveAttribute('data-id', 'center-awano')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('explore-count')).toContainText('1/57')
  })
})

test.describe('my school and settings', () => {
  test('selects a school, shows nearby facilities, and remembers it', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('myschool-button').click()
    await page.getByTestId('school-es-seibu').click()
    const detail = page.getByTestId('myschool-detail')
    await expect(detail).toContainText('西部小学校')
    await expect(detail).toContainText('西部分館')
    await expect(detail).toContainText('通学区域とは関係ありません')
    await expect(page.getByTestId('myschool-official-link')).toHaveAttribute('href', /id=105/)
    await page.reload()
    await page.getByTestId('myschool-button').click()
    await expect(page.getByTestId('school-es-seibu')).toHaveAttribute('aria-checked', 'true')
  })

  test('remembers sound and power-save settings, and can reset all data', async ({ page }) => {
    await page.goto('./')
    const toggle = page.getByTestId('sound-toggle')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await page.getByTestId('settings-button').click()
    await page.getByTestId('setting-powersave').click()
    await page.reload()
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false')
    expect(await page.evaluate(() => document.documentElement.classList.contains('power-save'))).toBe(true)
    await page.getByTestId('settings-button').click()
    await expect(page.getByTestId('setting-powersave')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('reset-button').click()
    await page.getByTestId('reset-confirm').click()
    await expect(page.getByTestId('setting-powersave')).toHaveAttribute('aria-checked', 'false')
    expect(await page.evaluate(() => localStorage.getItem('kamagaya-adventure:save'))).toContain('"powerSave":false')
  })
})

test.describe('mobile layout and map', () => {
  test('fits in a narrow portrait viewport without horizontal scroll and zooms', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await startMode(page, 'school', 4)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(320)
    const map = page.getByTestId('kamagaya-map')
    await expect(map).toBeVisible()
    await page.getByRole('button', { name: '拡大' }).click()
    await expect(map).not.toHaveAttribute('data-scale', '1.00')
    await page.getByRole('button', { name: '全体を表示' }).click()
    await expect(map).toHaveAttribute('data-scale', '1.00')
  })

  test('tapping a pin by pointer selects it (hit test by screen distance)', async ({ page }) => {
    await startMode(page, 'facility', 6)
    const target = (await page.getByTestId('question').getAttribute('data-target'))!
    // 北部分館は孤立しているので直接タップで選べる。他が出題なら対象ピンを直接タップ
    const pin = page.locator(`[data-testid="kamagaya-map"] [data-pin="${target}"] .pin-body`)
    const box = (await pin.boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    const style = await page.locator(`[data-pin="${target}"]`).getAttribute('data-style')
    // 密集していれば自動で拡大されるので、その場合はもう一度タップする
    if (style !== 'candidate') {
      const box2 = (await pin.boundingBox())!
      await page.mouse.click(box2.x + box2.width / 2, box2.y + box2.height / 2)
    }
    await expect(page.locator(`[data-pin="${target}"]`)).toHaveAttribute('data-style', 'candidate')
  })
})
