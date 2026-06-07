import icon from "../../assets/icon.png";

function ClawdLogo({ size = 32 }: { size?: number }): React.JSX.Element {
  return (
    <img
      src={icon}
      width={size}
      height={size}
      className="rounded-xl"
      alt="Clawd"
    />
  );
}

export default ClawdLogo;
