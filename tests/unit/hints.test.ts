import { describe, expect, it } from 'vitest'
import { ELEMENTARY_SCHOOLS } from '../../src/data/facilities'
import { describePosition, districtIdForTown, formatKm, nearbyFacilities } from '../../src/lib/hints'

describe('hints', () => {
  it('describePosition', () => {
    const vb: [number, number, number, number] = [0, 0, 100, 100]
    expect(describePosition([50, 50], vb)).toBe('市の真ん中あたり')
    expect(describePosition([10, 10], vb)).toBe('市の北西のほう')
    expect(describePosition([90, 90], vb)).toBe('市の南東のほう')
    expect(describePosition([50, 90], vb)).toBe('市の南のほう')
  })

  it('districtIdForTown', () => {
    expect(districtIdForTown('新鎌ケ谷')).toBe('town-0300')
    expect(districtIdForTown('存在しない町')).toBeNull()
  })

  it('近くの施設は距離順（くぬぎ山の西部小からは西部分館が最寄り）', () => {
    const seibu = ELEMENTARY_SCHOOLS.find((s) => s.name === '西部小学校')!
    const libs = nearbyFacilities(seibu, 'library', 2)
    expect(libs).toHaveLength(2)
    expect(libs[0]!.km).toBeLessThanOrEqual(libs[1]!.km)
    expect(libs[0]!.facility.name).toBe('西部分館')
    expect(formatKm(0.42)).toBe('約420m')
    expect(formatKm(1.26)).toBe('約1.3km')
  })
})
