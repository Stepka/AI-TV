import React, { useState, useEffect } from "react";
import AppButton from "./AppButton"; // твоя кнопка
import Input from "./Input";         // твой компонент Input

export default function ListEditor({ label, value, onChange }) {
  const [list, setList] = useState([]);

  // Парсим JSON при монтировании или изменении value
  useEffect(() => {
    try {
      if (Array.isArray(value)) {
        setList(value);
      }
      else {
        const parsed = JSON.parse(value || "[]");
        if (Array.isArray(parsed)) setList(parsed);
      }
    } catch {
      setList([]);
    }
  }, [value]);

  // Обновляем родителя при изменении списка
  useEffect(() => {
    onChange(list);
  }, [list]);

  const handleItemChange = (index, val) => {
    setList(prev => prev.map((item, i) => i === index ? val : item));
  };

  const addItem = () => setList(prev => [...prev, ""]);
  const removeItem = (index) => setList(prev => prev.filter((_, i) => i !== index));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <label style={{ color: "#fff", fontWeight: 600 }}>{label}</label>
      {list.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, width: "100%" }}>
          <Input
            value={item}
            onChange={v => handleItemChange(i, v)}
            style={{ flexGrow: 1, width: "100%" }} // расширяем по ширине родителя
          />
          <AppButton onClick={() => removeItem(i)} style={{ padding: "0 8px" }}>❌</AppButton>
        </div>
      ))}
      <AppButton onClick={addItem} style={{ marginTop: 8, width: "fit-content" }}>➕ Add Item</AppButton>
    </div>
  );
}