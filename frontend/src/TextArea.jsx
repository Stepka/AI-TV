

export default function TextArea({ label, value, onChange }) {
    return (
        <div style={{ marginBottom: 12, width: "100%" }}>
        <div style={{ marginBottom: 4 }}>{label}</div>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={4}
            style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            }}
        />
        </div>
    );
}