type StoryStudioBrandIconProps = {
  size: number;
};

export function StoryStudioBrandIcon({ size }: StoryStudioBrandIconProps) {
  const sparkleSize = Math.round(size * 0.34);
  const fontSize = Math.round(size * 0.34);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1030 0%, #6b4cff 100%)",
        borderRadius: Math.round(size * 0.22),
        color: "white",
        fontFamily: "Arial, sans-serif",
        fontWeight: 800,
        fontSize,
        letterSpacing: -1
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        S
        <div
          style={{
            position: "absolute",
            top: -Math.round(size * 0.08),
            right: -Math.round(size * 0.14),
            width: sparkleSize,
            height: sparkleSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.round(size * 0.22),
            color: "#b8a6ff"
          }}
        >
          ✦
        </div>
      </div>
    </div>
  );
}
