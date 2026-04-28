import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";
import Input from "./Input";
import { useI18n } from "./i18n";

export default function ListEditor({ label, value, onChange }) {
  const { t } = useI18n();
  const [list, setList] = useState([]);

  useEffect(() => {
    try {
      if (Array.isArray(value)) {
        setList(value);
      } else {
        const parsed = JSON.parse(value || "[]");
        if (Array.isArray(parsed)) setList(parsed);
      }
    } catch {
      setList([]);
    }
  }, [value]);

  useEffect(() => {
    onChange(list);
  }, [list]);

  const handleItemChange = (index, val) => {
    setList((prev) => prev.map((item, i) => (i === index ? val : item)));
  };

  const addItem = () => setList((prev) => [...prev, ""]);
  const removeItem = (index) => setList((prev) => prev.filter((_, i) => i !== index));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <label style={{ color: "#fff", fontWeight: 600 }}>{label}</label>
      {list.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, width: "100%" }}>
          <Input
            value={item}
            onChange={(v) => handleItemChange(i, v)}
            style={{ flexGrow: 1, width: "100%" }}
          />
          <AppButton onClick={() => removeItem(i)} style={{ padding: "0 8px" }}>
            X
          </AppButton>
        </div>
      ))}
      <AppButton onClick={addItem} style={{ marginTop: 8, width: "fit-content" }}>
        {t("common.addItem")}
      </AppButton>
    </div>
  );
}
