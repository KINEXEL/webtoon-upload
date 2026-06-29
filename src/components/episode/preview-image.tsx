type Props = {
  src: string;
  alt?: string;
  className?: string;
};

/**
 * 웹툰 콘텐츠 이미지 미리보기. 높이가 가변이라 next/image fill 이 부적합 →
 * 일반 img 로 컬럼 폭에 맞춰 세로로 흐르게 렌더.
 */
export function PreviewImage({ src, alt = "", className }: Props) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
