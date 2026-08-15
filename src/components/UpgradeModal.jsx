// src/components/UpgradeModal.jsx
import { Modal, Btn } from "./UI";
import { useTranslation } from "../i18n/index.js";
import { T } from "../styles/tokens";

export default function UpgradeModal({ onClose, onUpgrade }) {
  const { t } = useTranslation();

  return (
    <Modal title={t("pricingPage.limitModal.title")} onClose={onClose} width={420}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>
          {t("pricingPage.limitModal.description")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn
            onClick={() => {
              onClose();
              if (onUpgrade) onUpgrade();
            }}
            fullWidth
          >
            {t("pricingPage.limitModal.btn")}
          </Btn>
          <Btn variant="ghost" onClick={onClose} fullWidth>
            {t("pricingPage.limitModal.cancel")}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}