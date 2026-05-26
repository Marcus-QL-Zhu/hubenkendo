export const SECTION_CONFIG = [
  {
    id: 'hair',
    titleZh: '发型',
    titleEn: 'Hair',
    selectionMode: 'single',
    sourceHeadings: ['发型']
  },
  {
    id: 'hair-accessories',
    titleZh: '发饰',
    titleEn: 'Hair Accessories',
    selectionMode: 'multi',
    sourceHeadings: ['发饰']
  },
  {
    id: 'outfit',
    titleZh: '服饰',
    titleEn: 'Outfit',
    selectionMode: 'multi',
    sourceHeadings: ['服饰']
  },
  {
    id: 'expression',
    titleZh: '表情',
    titleEn: 'Expression',
    selectionMode: 'single',
    sourceHeadings: ['表情']
  },
  {
    id: 'pose',
    titleZh: '姿态',
    titleEn: 'Pose',
    selectionMode: 'single',
    sourceHeadings: ['肢体动作', '姿态']
  },
  {
    id: 'camera',
    titleZh: '镜头语言',
    titleEn: 'Camera',
    selectionMode: 'single',
    sourceHeadings: ['镜头语言']
  },
  {
    id: 'lighting',
    titleZh: '光影氛围',
    titleEn: 'Lighting',
    selectionMode: 'multi',
    sourceHeadings: ['光影']
  }
];

export function sectionForHeading(heading) {
  return SECTION_CONFIG.find((section) =>
    section.sourceHeadings.some((sourceHeading) => heading.includes(sourceHeading))
  );
}
