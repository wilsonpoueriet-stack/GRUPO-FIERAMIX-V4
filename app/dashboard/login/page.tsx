import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getAdminSession, isAdminAuthConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function DashboardLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  const configured = isAdminAuthConfigured();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 20% 10%, rgba(32,220,142,.12), transparent 30%), radial-gradient(circle at 80% 0%, rgba(99,102,241,.18), transparent 35%), #050914",
        color: "#f8fbff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(460px, 100%)",
          padding: "34px",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,.1)",
          background: "rgba(9,16,34,.92)",
          boxShadow: "0 28px 80px rgba(0,0,0,.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 26,
          }}
        >
          <img
            src="/icons/fieramix-192.png"
            alt="FIERAMIX"
            width={58}
            height={58}
            style={{
              width: 58,
              height: 58,
              objectFit: "contain",
              borderRadius: 15,
              background: "white",
            }}
          />

          <div>
            <div
              style={{
                color: "#43f5b1",
                fontSize: ".72rem",
                fontWeight: 900,
                letterSpacing: ".14em",
              }}
            >
              ACCESO ADMINISTRATIVO
            </div>
            <h1
              style={{
                margin: "5px 0 0",
                fontSize: "1.65rem",
                lineHeight: 1.05,
              }}
            >
              PANEL FIERAMIX
            </h1>
          </div>
        </div>

        <p
          style={{
            margin: "0 0 24px",
            color: "#b7c0d7",
            lineHeight: 1.55,
            fontSize: ".9rem",
          }}
        >
          Centro privado de operaciones de EL GRUPO FIERAMIX.COM.
        </p>

        {!configured ? (
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              border: "1px solid rgba(255,190,70,.35)",
              background: "rgba(255,190,70,.08)",
              color: "#ffd98b",
              fontSize: ".86rem",
              lineHeight: 1.5,
            }}
          >
            El acceso todavía no está activado. Configura las credenciales privadas en Netlify para habilitar este panel.
          </div>
        ) : (
          <LoginForm />
        )}

        <style>{`
          .adminLoginForm {
            display: grid;
            gap: 16px;
          }

          .adminLoginForm label {
            display: grid;
            gap: 8px;
          }

          .adminLoginForm label > span {
            color: #8f9ab5;
            font-size: .66rem;
            font-weight: 900;
            letter-spacing: .12em;
          }

          .adminLoginForm input {
            width: 100%;
            box-sizing: border-box;
            min-height: 50px;
            padding: 0 14px;
            border-radius: 13px;
            border: 1px solid rgba(255,255,255,.12);
            outline: none;
            color: #fff;
            background: rgba(255,255,255,.045);
            font-size: .92rem;
          }

          .adminLoginForm input:focus {
            border-color: rgba(67,245,177,.65);
            box-shadow: 0 0 0 3px rgba(67,245,177,.08);
          }

          .adminLoginForm button {
            min-height: 50px;
            margin-top: 3px;
            border: 0;
            border-radius: 13px;
            color: #04120c;
            background: linear-gradient(135deg, #20dc8e, #7bf5be);
            font-weight: 950;
            letter-spacing: .04em;
            cursor: pointer;
          }

          .adminLoginForm button:disabled {
            opacity: .55;
            cursor: not-allowed;
          }

          .adminLoginError {
            margin: 0;
            padding: 11px 12px;
            border-radius: 11px;
            color: #ffb0bd;
            background: rgba(255,75,100,.1);
            border: 1px solid rgba(255,75,100,.22);
            font-size: .82rem;
          }
        `}</style>
      </section>
    </main>
  );
}
