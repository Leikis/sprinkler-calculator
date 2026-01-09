"use client";

import { useState, useRef } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface FirstNodeInput {
  node_nr: 1;
  k_faktor: number;
  min_trykk_bar: number;
  dekningsareal_m2: number;
  krav_mm_m2: number;
  diameter_mm: number;
  lengde_m: number;
  antall_90_bend: number;
  antall_tstykker: number;
}

interface NodeInput {
  node_nr: number;
  k_faktor: number;
  diameter_mm: number;
  lengde_m: number;
  antall_90_bend: number;
  antall_tstykker: number;
  er_grenror_h: boolean;
  er_grenror_v: boolean;
  er_ekv_kfaktor: boolean;
}

interface RettsrekkInput {
  rs_nr: number;
  diameter_mm: number;
  lengde_m: number;
  antall_90_bend: number;
  antall_tstykker: number;
}

interface VentilInput {
  type: string;
  dimensjon: string;
  tilkoblet_rs: number;
}

const VALVE_TYPES = [
  "Sluseventil",
  "Alarmventil/tilbakeslagsventil hengslet",
  "Alarmventil/tilbakeslagsventil membran",
  "Spjeldventil",
  "Kuleventil",
] as const;

const VALVE_DIMENSIONS = ["NA", "50", "65", "80", "100", "150", "200", "250"] as const;

interface NodeResult {
  node_nr: number;
  flow_lpm: number;
  pressure_at_node_bar: number;
  cumulative_flow_lpm?: number;
}

interface RettsrekkResult {
  rs_nr: number;
  pressure_drop_per_m_bar: number;
  outlet_pressure_bar: number;
  total_length_m?: number;
}

interface CalculationResult {
  success: boolean;
  error?: string;
  total_vannmengde_lpm?: number;
  total_trykk_bar?: number;
  noder?: NodeResult[];
  rettstrekk?: RettsrekkResult[];
  ventil_ekvivalent_lengde?: number;
}

interface ProjectData {
  version: string;
  anleggsnavn: string;
  kommentar: string;
  generelle_parametre: {
    c_faktor: number;
    hoyde_anlegg_m: number;
    antall_noder: number;
  };
  firstNode: FirstNodeInput;
  nodes: NodeInput[];
  rettstrekk: RettsrekkInput[];
  ventiler: VentilInput[];
}

const createDefaultVentiler = (): VentilInput[] =>
  VALVE_TYPES.map((type) => ({
    type,
    dimensjon: "NA",
    tilkoblet_rs: 5,
  }));

// =============================================================================
// DEFAULTS
// =============================================================================

const createDefaultFirstNode = (): FirstNodeInput => ({
  node_nr: 1,
  k_faktor: 80,
  min_trykk_bar: 0.5,
  dekningsareal_m2: 12,
  krav_mm_m2: 5,
  diameter_mm: 27.3,
  lengde_m: 3,
  antall_90_bend: 0,
  antall_tstykker: 0,
});

const createDefaultNode = (nr: number): NodeInput => ({
  node_nr: nr,
  k_faktor: 80,
  diameter_mm: 27.3,
  lengde_m: 0,
  antall_90_bend: 0,
  antall_tstykker: 1,
  er_grenror_h: false,
  er_grenror_v: false,
  er_ekv_kfaktor: false,
});

const createDefaultRettstrekk = (nr: number): RettsrekkInput => ({
  rs_nr: nr,
  diameter_mm: nr === 1 ? 27.3 : 36,
  lengde_m: 0,
  antall_90_bend: 0,
  antall_tstykker: 0,
});

// =============================================================================
// COMPONENTS
// =============================================================================

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [displayValue, setDisplayValue] = useState(String(value));
  
  // Sync display when external value changes (e.g., from load project)
  const prevValue = useRef(value);
  if (prevValue.current !== value && parseFloat(displayValue) !== value) {
    setDisplayValue(String(value));
    prevValue.current = value;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(e) => {
          let val = e.target.value;
          
          // Allow empty string for typing
          if (val === "") {
            setDisplayValue("");
            onChange(0);
            return;
          }
          
          // Only allow valid number characters
          if (!/^-?\d*\.?\d*$/.test(val)) {
            return;
          }
          
          // Remove leading zeros (but keep "0." for decimals)
          if (val.length > 1 && val[0] === "0" && val[1] !== ".") {
            val = val.replace(/^0+/, "") || "0";
          }
          if (val.length > 2 && val[0] === "-" && val[1] === "0" && val[2] !== ".") {
            val = "-" + val.slice(1).replace(/^0+/, "");
          }
          
          setDisplayValue(val);
          
          const num = parseFloat(val);
          if (!isNaN(num)) {
            onChange(num);
            prevValue.current = num;
          }
        }}
        onBlur={() => {
          // On blur, format the display value properly
          if (displayValue === "" || displayValue === "-" || displayValue === ".") {
            setDisplayValue("0");
            onChange(0);
          } else {
            const num = parseFloat(displayValue);
            if (!isNaN(num)) {
              setDisplayValue(String(num));
            }
          }
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

function FirstNodeSection({
  node,
  onChange,
}: {
  node: FirstNodeInput;
  onChange: (node: FirstNodeInput) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
      <h2 className="text-lg font-bold mb-4 text-blue-700 border-b border-gray-200 pb-2">
        Node 1 - Første Sprinklerhode
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <InputField
          label="K-faktor"
          value={node.k_faktor}
          onChange={(v) => onChange({ ...node, k_faktor: v })}
        />
        <InputField
          label="Min. trykk (Bar)"
          value={node.min_trykk_bar}
          onChange={(v) => onChange({ ...node, min_trykk_bar: v })}
        />
        <InputField
          label="Dekningsareal (m²)"
          value={node.dekningsareal_m2}
          onChange={(v) => onChange({ ...node, dekningsareal_m2: v })}
        />
        <InputField
          label="Krav (mm/min/m²)"
          value={node.krav_mm_m2}
          onChange={(v) => onChange({ ...node, krav_mm_m2: v })}
        />
      </div>

      <h3 className="text-md font-semibold mb-3 text-gray-800 bg-gray-100 px-3 py-2 rounded">
        Rettstrekk 1 (RS1)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField
          label="Diameter (mm)"
          value={node.diameter_mm}
          onChange={(v) => onChange({ ...node, diameter_mm: v })}
        />
        <InputField
          label="Lengde (m)"
          value={node.lengde_m}
          onChange={(v) => onChange({ ...node, lengde_m: v })}
        />
        <InputField
          label="90° Bend (stk)"
          value={node.antall_90_bend}
          onChange={(v) => onChange({ ...node, antall_90_bend: v })}
        />
        <InputField
          label="T-stykker (stk)"
          value={node.antall_tstykker}
          onChange={(v) => onChange({ ...node, antall_tstykker: v })}
        />
      </div>
    </div>
  );
}

function NodeSection({
  node,
  onChange,
}: {
  node: NodeInput;
  onChange: (node: NodeInput) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-lg font-bold text-blue-700">
          Node {node.node_nr}
        </h2>
        <div className="flex flex-wrap gap-4 mt-2 sm:mt-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={node.er_grenror_h}
              onChange={(e) =>
                onChange({ ...node, er_grenror_h: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Grenrør H</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={node.er_ekv_kfaktor}
              onChange={(e) =>
                onChange({ ...node, er_ekv_kfaktor: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Ekv k-faktor</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={node.er_grenror_v}
              onChange={(e) =>
                onChange({ ...node, er_grenror_v: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Grenrør V</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <InputField
          label="K-faktor"
          value={node.k_faktor}
          onChange={(v) => onChange({ ...node, k_faktor: v })}
        />
        <InputField
          label="Diameter (mm)"
          value={node.diameter_mm}
          onChange={(v) => onChange({ ...node, diameter_mm: v })}
        />
        <InputField
          label="Lengde (m)"
          value={node.lengde_m}
          onChange={(v) => onChange({ ...node, lengde_m: v })}
        />
        <InputField
          label="90° Bend (stk)"
          value={node.antall_90_bend}
          onChange={(v) => onChange({ ...node, antall_90_bend: v })}
        />
        <InputField
          label="T-stykker (stk)"
          value={node.antall_tstykker}
          onChange={(v) => onChange({ ...node, antall_tstykker: v })}
        />
      </div>
    </div>
  );
}

function RettsrekkSection({
  rettstrekk,
  onChange,
}: {
  rettstrekk: RettsrekkInput;
  onChange: (rs: RettsrekkInput) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 ml-4">
      <h3 className="text-md font-semibold mb-3 text-gray-800">
        Rettstrekk {rettstrekk.rs_nr} (RS{rettstrekk.rs_nr})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField
          label="Diameter (mm)"
          value={rettstrekk.diameter_mm}
          onChange={(v) => onChange({ ...rettstrekk, diameter_mm: v })}
        />
        <InputField
          label="Lengde (m)"
          value={rettstrekk.lengde_m}
          onChange={(v) => onChange({ ...rettstrekk, lengde_m: v })}
        />
        <InputField
          label="90° Bend (stk)"
          value={rettstrekk.antall_90_bend}
          onChange={(v) => onChange({ ...rettstrekk, antall_90_bend: v })}
        />
        <InputField
          label="T-stykker (stk)"
          value={rettstrekk.antall_tstykker}
          onChange={(v) => onChange({ ...rettstrekk, antall_tstykker: v })}
        />
      </div>
    </div>
  );
}

function ValveTable({
  ventiler,
  onChange,
  antallNoder,
}: {
  ventiler: VentilInput[];
  onChange: (ventiler: VentilInput[]) => void;
  antallNoder: number;
}) {
  const updateVentil = (index: number, field: keyof VentilInput, value: string | number) => {
    const newVentiler = [...ventiler];
    newVentiler[index] = { ...newVentiler[index], [field]: value };
    onChange(newVentiler);
  };

  const getShortName = (type: string) => {
    if (type.includes("hengslet")) return "Alarmventil (hengslet)";
    if (type.includes("membran")) return "Alarmventil (membran)";
    return type;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
      <h2 className="text-lg font-bold mb-4 text-blue-700 border-b border-gray-200 pb-2">Ventiler</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Dimensjon (mm)</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Tilkoblet RS</th>
            </tr>
          </thead>
          <tbody>
            {ventiler.map((ventil, index) => (
              <tr key={ventil.type} className="border-b border-gray-200 last:border-b-0">
                <td className="py-3 px-4 text-gray-900 font-medium">{getShortName(ventil.type)}</td>
                <td className="py-3 px-4">
                  <select
                    value={ventil.dimensjon}
                    onChange={(e) => updateVentil(index, "dimensjon", e.target.value)}
                    className="w-24 border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {VALVE_DIMENSIONS.map((dim) => (
                      <option key={dim} value={dim}>{dim}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={ventil.tilkoblet_rs}
                    onChange={(e) => updateVentil(index, "tilkoblet_rs", Number(e.target.value))}
                    className="w-20 border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: antallNoder }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// SYSTEM DIAGRAM
// =============================================================================

interface DiagramNode {
  node_nr: number;
  flow_lpm: number;
  pressure_bar: number;
  is_branch: boolean;
  branch_side?: "H" | "V";
}

function SystemDiagram({
  nodes,
  nodeInputs,
  antallNoder,
}: {
  nodes: NodeResult[] | undefined;
  nodeInputs: NodeInput[];
  antallNoder: number;
}) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
        <h2 className="text-lg font-bold mb-4 text-blue-700 border-b border-gray-200 pb-2">Systemdiagram</h2>
        <div className="h-48 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          Kjor beregning for a se diagram
        </div>
      </div>
    );
  }

  const nodeRadius = 28;
  const nodeSpacingX = 110;
  const nodeSpacingY = 90;
  const branchOffset = 65;
  const startX = 70;
  const startY = 60;
  const width = Math.max(450, startX * 2 + (antallNoder - 1) * nodeSpacingX + 100);
  const height = startY * 2 + nodeSpacingY + branchOffset + 20;

  const diagramNodes: DiagramNode[] = nodes.map((node, index) => {
    const inputNode = index === 0 ? null : nodeInputs[index - 1];
    const isBranch = inputNode ? (inputNode.er_grenror_h || inputNode.er_grenror_v) : false;
    const branchSide = inputNode?.er_grenror_h ? "H" : inputNode?.er_grenror_v ? "V" : undefined;
    
    return {
      node_nr: node.node_nr,
      flow_lpm: node.flow_lpm,
      pressure_bar: node.pressure_at_node_bar,
      is_branch: isBranch,
      branch_side: branchSide,
    };
  });

  const getNodePosition = (index: number) => {
    const node = diagramNodes[index];
    const baseX = startX + index * nodeSpacingX;
    const baseY = startY + nodeSpacingY;
    
    if (node.is_branch) {
      const yOffset = node.branch_side === "H" ? -branchOffset : branchOffset;
      return { x: baseX, y: baseY + yOffset, mainY: baseY };
    }
    return { x: baseX, y: baseY, mainY: baseY };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
      <h2 className="text-lg font-bold mb-4 text-blue-700 border-b border-gray-200 pb-2">Systemdiagram</h2>
      <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
        <svg
          width={width}
          height={height}
          className="min-w-full"
          style={{ minWidth: width }}
        >
          {diagramNodes.map((node, index) => {
            if (index === 0) return null;
            
            const fromPos = getNodePosition(index - 1);
            const toPos = getNodePosition(index);
            
            if (node.is_branch) {
              return (
                <g key={`pipe-${index}`}>
                  <line
                    x1={fromPos.x}
                    y1={fromPos.mainY}
                    x2={toPos.x}
                    y2={toPos.mainY}
                    stroke="#4B5563"
                    strokeWidth={4}
                  />
                  <circle cx={toPos.x} cy={toPos.mainY} r={5} fill="#4B5563" />
                  <line
                    x1={toPos.x}
                    y1={toPos.mainY}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="#6B7280"
                    strokeWidth={3}
                    strokeDasharray="6,3"
                  />
                  <text
                    x={(fromPos.x + toPos.x) / 2}
                    y={fromPos.mainY - 12}
                    textAnchor="middle"
                    className="text-sm font-medium"
                    fill="#374151"
                  >
                    RS{index}
                  </text>
                </g>
              );
            }
            
            return (
              <g key={`pipe-${index}`}>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#4B5563"
                  strokeWidth={4}
                />
                <text
                  x={(fromPos.x + toPos.x) / 2}
                  y={fromPos.y - 12}
                  textAnchor="middle"
                  className="text-sm font-medium"
                  fill="#374151"
                >
                  RS{index}
                </text>
              </g>
            );
          })}

          {diagramNodes.length > 0 && (
            <g>
              <line
                x1={getNodePosition(diagramNodes.length - 1).x}
                y1={getNodePosition(diagramNodes.length - 1).mainY}
                x2={getNodePosition(diagramNodes.length - 1).x + 60}
                y2={getNodePosition(diagramNodes.length - 1).mainY}
                stroke="#4B5563"
                strokeWidth={4}
              />
              <text
                x={getNodePosition(diagramNodes.length - 1).x + 70}
                y={getNodePosition(diagramNodes.length - 1).mainY + 5}
                className="text-sm font-semibold"
                fill="#1F2937"
              >
                Vannforsyning
              </text>
            </g>
          )}

          {diagramNodes.map((node, index) => {
            const pos = getNodePosition(index);
            const isFirst = index === 0;
            
            return (
              <g key={`node-${node.node_nr}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={isFirst ? "#2563EB" : node.is_branch ? "#7C3AED" : "#059669"}
                  stroke={isFirst ? "#1D4ED8" : node.is_branch ? "#5B21B6" : "#047857"}
                  strokeWidth={3}
                />
                <text
                  x={pos.x}
                  y={pos.y - 4}
                  textAnchor="middle"
                  className="text-sm font-bold"
                  fill="white"
                >
                  S{node.node_nr}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 12}
                  textAnchor="middle"
                  className="text-xs"
                  fill="white"
                >
                  {node.flow_lpm.toFixed(0)} l/m
                </text>
                <text
                  x={pos.x}
                  y={pos.y + nodeRadius + 18}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="#374151"
                >
                  {node.pressure_bar.toFixed(2)} bar
                </text>
              </g>
            );
          })}

          <g transform={`translate(15, ${height - 25})`}>
            <circle cx={8} cy={0} r={8} fill="#2563EB" />
            <text x={22} y={4} className="text-xs font-medium" fill="#374151">Forste</text>
            <circle cx={80} cy={0} r={8} fill="#059669" />
            <text x={94} y={4} className="text-xs font-medium" fill="#374151">Inline</text>
            <circle cx={150} cy={0} r={8} fill="#7C3AED" />
            <text x={164} y={4} className="text-xs font-medium" fill="#374151">Grenror</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function Home() {
  const [anleggsnavn, setAnleggsnavn] = useState("");
  const [kommentar, setKommentar] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cFaktor, setCFaktor] = useState(120);
  const [hoydeAnlegg, setHoydeAnlegg] = useState(0);
  const [antallNoder, setAntallNoder] = useState(4);

  const [firstNode, setFirstNode] = useState<FirstNodeInput>(createDefaultFirstNode());
  const [nodes, setNodes] = useState<NodeInput[]>(() =>
    Array.from({ length: 19 }, (_, i) => createDefaultNode(i + 2))
  );
  const [rettstrekk, setRettstrekk] = useState<RettsrekkInput[]>(() =>
    Array.from({ length: 19 }, (_, i) => createDefaultRettstrekk(i + 2))
  );
  const [ventiler, setVentiler] = useState<VentilInput[]>(createDefaultVentiler);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateNode = (index: number, node: NodeInput) => {
    const newNodes = [...nodes];
    newNodes[index] = node;
    setNodes(newNodes);
  };

  const updateRettstrekk = (index: number, rs: RettsrekkInput) => {
    const newRettstrekk = [...rettstrekk];
    newRettstrekk[index] = rs;
    setRettstrekk(newRettstrekk);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    const apiNodes = [
      {
        node_nr: 1,
        k_faktor: firstNode.k_faktor,
        min_trykk_bar: firstNode.min_trykk_bar,
        dekningsareal_m2: firstNode.dekningsareal_m2,
        krav_mm_m2: firstNode.krav_mm_m2,
        diameter_mm: firstNode.diameter_mm,
        lengde_m: firstNode.lengde_m,
        antall_90_bend: firstNode.antall_90_bend,
        antall_tstykker: firstNode.antall_tstykker,
      },
      ...nodes.slice(0, antallNoder - 1).map((n) => ({
        node_nr: n.node_nr,
        k_faktor: n.k_faktor,
        diameter_mm: n.diameter_mm,
        lengde_m: n.lengde_m,
        antall_90_bend: n.antall_90_bend,
        antall_tstykker: n.antall_tstykker,
        er_grenror: n.er_grenror_h || n.er_grenror_v,
        er_ekv_kfaktor: n.er_ekv_kfaktor,
      })),
    ];

    const apiRettstrekk = rettstrekk.slice(0, antallNoder - 1).map((rs) => ({
      rs_nr: rs.rs_nr,
      diameter_mm: rs.diameter_mm,
      lengde_m: rs.lengde_m,
      antall_90_bend: rs.antall_90_bend,
      antall_tstykker: rs.antall_tstykker,
    }));

    const apiVentiler: Record<string, { dimensjon: string; tilkoblet_rs: number }> = {};
    ventiler.forEach((v) => {
      if (v.dimensjon !== "NA") {
        apiVentiler[v.type] = {
          dimensjon: v.dimensjon,
          tilkoblet_rs: v.tilkoblet_rs,
        };
      }
    });

    const inputData = {
      generelle_parametre: {
        c_faktor: cFaktor,
        hoyde_anlegg_m: hoydeAnlegg,
      },
      noder: apiNodes,
      rettstrekk: apiRettstrekk,
      ventiler: apiVentiler,
    };

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || "Calculation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = () => {
    const projectData: ProjectData = {
      version: "1.0",
      anleggsnavn,
      kommentar,
      generelle_parametre: {
        c_faktor: cFaktor,
        hoyde_anlegg_m: hoydeAnlegg,
        antall_noder: antallNoder,
      },
      firstNode,
      nodes,
      rettstrekk,
      ventiler,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${anleggsnavn || "sprinkler-prosjekt"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ProjectData;
        setAnleggsnavn(data.anleggsnavn || "");
        setKommentar(data.kommentar || "");
        setCFaktor(data.generelle_parametre.c_faktor);
        setHoydeAnlegg(data.generelle_parametre.hoyde_anlegg_m);
        setAntallNoder(data.generelle_parametre.antall_noder);
        setFirstNode(data.firstNode);
        setNodes(data.nodes);
        setRettstrekk(data.rettstrekk);
        setVentiler(data.ventiler);
        setResult(null);
        setError(null);
      } catch {
        setError("Kunne ikke lese fil. Sjekk at det er en gyldig JSON-fil.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportPDF = async () => {
    if (!result || !result.success) {
      setError("Kjor beregning forst for a eksportere PDF");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Popup blokkert. Tillat popups for a eksportere PDF.");
      return;
    }

    const today = new Date().toLocaleDateString("nb-NO");
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sprinklerberegning - ${anleggsnavn || "Uten navn"}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; color: #111; }
    h1 { color: #1e40af; font-size: 24px; margin-bottom: 5px; }
    h2 { color: #1e40af; font-size: 16px; margin-top: 20px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    .header { margin-bottom: 20px; }
    .subtitle { color: #333; font-size: 14px; font-weight: bold; }
    .meta { color: #555; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
    th { background-color: #e5e7eb; font-weight: bold; color: #111; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .summary-box { background: #ecfdf5; border: 2px solid #10b981; padding: 15px; border-radius: 8px; flex: 1; }
    .summary-label { color: #555; font-size: 11px; }
    .summary-value { font-size: 22px; font-weight: bold; color: #065f46; }
    .comment { background: #f3f4f6; padding: 12px; border-radius: 4px; margin: 10px 0; }
    .footer { margin-top: 40px; color: #666; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sprinklerberegning</h1>
    <div class="subtitle">${anleggsnavn || "Uten navn"}</div>
    <div class="meta">Dato: ${today} | C-faktor: ${cFaktor} | Hoyde: ${hoydeAnlegg}m | Antall noder: ${antallNoder}</div>
  </div>
  ${kommentar ? `<div class="comment"><strong>Kommentar:</strong> ${kommentar}</div>` : ""}
  <div class="summary">
    <div class="summary-box">
      <div class="summary-label">Total vannmengde</div>
      <div class="summary-value">${result.total_vannmengde_lpm?.toFixed(1)} l/min</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Totalt trykk (PQ-krav)</div>
      <div class="summary-value">${result.total_trykk_bar?.toFixed(3)} Bar</div>
    </div>
  </div>
  <h2>Noder (Sprinklerhoder)</h2>
  <table>
    <thead><tr><th>Node</th><th>Vannmengde Q (l/min)</th><th>Trykk (Bar)</th><th>Kumulativ Q (l/min)</th></tr></thead>
    <tbody>
      ${result.noder?.map(node => `<tr><td>S${node.node_nr}</td><td>${node.flow_lpm.toFixed(1)}</td><td>${node.pressure_at_node_bar.toFixed(4)}</td><td>${node.cumulative_flow_lpm?.toFixed(1) || "-"}</td></tr>`).join("") || ""}
    </tbody>
  </table>
  <h2>Rettstrekk (Rorforinger)</h2>
  <table>
    <thead><tr><th>RS</th><th>Trykktap/m (Bar/m)</th><th>Utlopstrykk (Bar)</th></tr></thead>
    <tbody>
      ${result.rettstrekk?.map(rs => `<tr><td>RS${rs.rs_nr}</td><td>${rs.pressure_drop_per_m_bar.toFixed(6)}</td><td>${rs.outlet_pressure_bar.toFixed(4)}</td></tr>`).join("") || ""}
    </tbody>
  </table>
  <div class="footer">Generert av Sprinkler Calculator | NS 12845 | ${today}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const visibleNodes = nodes.slice(0, antallNoder - 1);
  const visibleRettstrekk = rettstrekk.slice(0, antallNoder - 1);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sprinkler Calculator</h1>
              <p className="text-gray-600">Hydraulisk beregning av sprinkleranlegg etter NS 12845</p>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLoadProject}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
              >
                Importer
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
              >
                Lagre
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Eksporter PDF
              </button>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Prosjektinfo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Anleggsnavn</label>
              <input
                type="text"
                value={anleggsnavn}
                onChange={(e) => setAnleggsnavn(e.target.value)}
                placeholder="F.eks. Bygg A - Kontorlokaler"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Kommentar</label>
              <input
                type="text"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="Valgfri beskrivelse"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* General Parameters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Generelle Parametre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">C-faktor</label>
              <select
                value={cFaktor}
                onChange={(e) => setCFaktor(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={100}>100</option>
                <option value={110}>110</option>
                <option value={120}>120</option>
                <option value={130}>130</option>
                <option value={140}>140</option>
              </select>
            </div>
            <InputField
              label="Hoyde anlegg (m)"
              value={hoydeAnlegg}
              onChange={setHoydeAnlegg}
            />
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Antall noder</label>
              <select
                value={antallNoder}
                onChange={(e) => setAntallNoder(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* First Node */}
        <FirstNodeSection node={firstNode} onChange={setFirstNode} />

        {/* Additional Nodes and Rettstrekk */}
        {visibleNodes.map((node, index) => (
          <div key={node.node_nr}>
            <NodeSection node={node} onChange={(n) => updateNode(index, n)} />
            {visibleRettstrekk[index] && (
              <RettsrekkSection
                rettstrekk={visibleRettstrekk[index]}
                onChange={(rs) => updateRettstrekk(index, rs)}
              />
            )}
          </div>
        ))}

        {/* Valve Table */}
        <ValveTable ventiler={ventiler} onChange={setVentiler} antallNoder={antallNoder} />

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors mb-6 shadow-sm"
        >
          {loading ? "Beregner..." : "Beregn Alle Noder"}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg mb-6 font-medium">
            {error}
          </div>
        )}

        {/* System Diagram */}
        <SystemDiagram nodes={result?.noder} nodeInputs={nodes} antallNoder={antallNoder} />

        {/* Results */}
        {result && result.success && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-emerald-800 mb-4">Beregningsresultater</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-sm text-gray-600 font-medium">Total vannmengde</div>
                <div className="text-3xl font-bold text-gray-900">
                  {result.total_vannmengde_lpm?.toFixed(1)} <span className="text-lg">l/min</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="text-sm text-gray-600 font-medium">Totalt trykk (PQ-krav)</div>
                <div className="text-3xl font-bold text-gray-900">
                  {result.total_trykk_bar?.toFixed(3)} <span className="text-lg">Bar</span>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-emerald-800 mb-2">Noder (Sprinklerhoder)</h3>
            <div className="bg-white rounded-lg overflow-hidden mb-4 border border-emerald-200">
              <table className="min-w-full">
                <thead className="bg-emerald-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Node</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Vannmengde Q</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Trykk</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Kumulativ Q</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.noder?.map((node) => (
                    <tr key={node.node_nr}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">S{node.node_nr}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{node.flow_lpm.toFixed(1)} l/min</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{node.pressure_at_node_bar.toFixed(4)} Bar</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{node.cumulative_flow_lpm?.toFixed(1) || "-"} l/min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.rettstrekk && result.rettstrekk.length > 0 && (
              <>
                <h3 className="font-bold text-emerald-800 mb-2">Rettstrekk (Rorforinger)</h3>
                <div className="bg-white rounded-lg overflow-hidden border border-emerald-200">
                  <table className="min-w-full">
                    <thead className="bg-emerald-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">RS</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Trykktap/m</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Utlopstrykk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.rettstrekk.map((rs) => (
                        <tr key={rs.rs_nr}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">RS{rs.rs_nr}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{rs.pressure_drop_per_m_bar.toFixed(6)} Bar/m</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{rs.outlet_pressure_bar.toFixed(4)} Bar</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Debug JSON */}
        {result && (
          <details className="mt-6">
            <summary className="cursor-pointer text-gray-600 text-sm font-medium hover:text-gray-900">
              Vis ra JSON-resultat
            </summary>
            <pre className="mt-2 bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
