import Link from "next/link";

export default function SupportFloat() {
  return (
    <Link
      className="supportFloat"
      href="/apoyar"
      aria-label="Apoya voluntariamente a EL GRUPO FIERAMIX.COM"
      title="Apoya a FIERAMIX"
    >
      <span>
        <small>APORTE VOLUNTARIO</small>
        <strong>APOYA A FIERAMIX</strong>
      </span>
      <b aria-hidden="true">♥</b>
    </Link>
  );
}
