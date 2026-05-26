import sharp from 'sharp';

export async function splitImageIntoTiles(inputPath, outputPaths) {
  if (outputPaths.length !== 4) {
    throw new Error(`Expected four output paths, received ${outputPaths.length}`);
  }

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Cannot read image dimensions: ${inputPath}`);
  }

  const leftWidth = Math.floor(metadata.width / 2);
  const rightWidth = metadata.width - leftWidth;
  const topHeight = Math.floor(metadata.height / 2);
  const bottomHeight = metadata.height - topHeight;
  const regions = [
    { left: 0, top: 0, width: leftWidth, height: topHeight },
    { left: leftWidth, top: 0, width: rightWidth, height: topHeight },
    { left: 0, top: topHeight, width: leftWidth, height: bottomHeight },
    { left: leftWidth, top: topHeight, width: rightWidth, height: bottomHeight }
  ];

  await Promise.all(
    regions.map((region, index) =>
      sharp(inputPath)
        .extract(region)
        .webp({ quality: 86 })
        .toFile(outputPaths[index])
    )
  );

  return regions;
}
