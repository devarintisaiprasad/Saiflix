// Poster art is drawn with CSS gradients, so no image files are needed
export default function Poster({ title, large = false }) {
  const style = {
    background: `linear-gradient(155deg, hsl(${title.hue} 70% 42%), hsl(${(title.hue + 50) % 360} 65% 14%))`,
  };
  return (
    <div className={large ? "poster large" : "poster"} style={style}>
      <small>{title.genre}</small>
      <strong>{title.title}</strong>
      {title.type === "series" && <em>SERIES</em>}
    </div>
  );
}
