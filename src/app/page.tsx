"use client";

import { useState } from "react";

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
  type = "number",
  step,
  className = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type?: string;
  step?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3 text-blue-800">
        Første Sprinklerhode
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InputField
          label="K-faktor"
          value={node.k_faktor}
          onChange={(v) => onChange({ ...node, k_faktor: v })}
        />
        <InputField
          label="Min. trykk (Bar)"
          value={node.min_trykk_bar}
          onChange={(v) => onChange({ ...node, min_trykk_bar: v })}
          step="0.1"
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

      <h3 className="text-md font-medium mt-4 mb-2 text-gray-700">
        Rettstrekk 1
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InputField
          label="Diameter (mm)"
          value={node.diameter_mm}
          onChange={(v) => onChange({ ...node, diameter_mm: v })}
          step="0.1"
        />
        <InputField
          label="Lengde (m)"
          value={node.lengde_m}
          onChange={(v) => onChange({ ...node, lengde_m: v })}
          step="0.1"
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
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-blue-800">
          Node {node.node_nr}
        </h2>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={node.er_grenror_h}
              onChange={(e) =>
                onChange({ ...node, er_grenror_h: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            Grenrør H
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={node.er_ekv_kfaktor}
              onChange={(e) =>
                onChange({ ...node, er_ekv_kfaktor: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            Ekv k-faktor
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={node.er_grenror_v}
              onChange={(e) =>
                onChange({ ...node, er_grenror_v: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            Grenrør V
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <InputField
          label="K-faktor"
          value={node.k_faktor}
          onChange={(v) => onChange({ ...node, k_faktor: v })}
        />
        <InputField
          label="Diameter (mm)"
          value={node.diameter_mm}
          onChange={(v) => onChange({ ...node, diameter_mm: v })}
          step="0.1"
        />
        <InputField
          label="Lengde (m)"
          value={node.lengde_m}
          onChange={(v) => onChange({ ...node, lengde_m: v })}
          step="0.1"
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
    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
      <h3 className="text-md font-medium mb-2 text-gray-700">
        Rettstrekk {rettstrekk.rs_nr}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InputField
          label="Diameter (mm)"
          value={rettstrekk.diameter_mm}
          onChange={(v) => onChange({ ...rettstrekk, diameter_mm: v })}
          step="0.1"
        />
        <InputField
          label="Lengde (m)"
          value={rettstrekk.lengde_m}
          onChange={(v) => onChange({ ...rettstrekk, lengde_m: v })}
          step="0.1"
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
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3 text-blue-800">Ventiler</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-medium text-gray-700">Type</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700">Dim (mm)</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700">RS</th>
            </tr>
          </thead>
          <tbody>
            {ventiler.map((ventil, index) => (
              <tr key={ventil.type} className="border-b last:border-b-0">
                <td className="py-2 pr-4 text-gray-600">{getShortName(ventil.type)}</td>
                <td className="py-2 px-2">
                  <select
                    value={ventil.dimensjon}
                    onChange={(e) => updateVentil(index, "dimensjon", e.target.value)}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {VALVE_DIMENSIONS.map((dim) => (
                      <option key={dim} value={dim}>{dim}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select
                    value={ventil.tilkoblet_rs}
                    onChange={(e) => updateVentil(index, "tilkoblet_rs", Number(e.target.value))}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
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
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3 text-blue-800">Systemdiagram</h2>
        <div className="h-48 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          Kjør beregning for å se diagram
        </div>
      </div>
    );
  }

  // Layout constants
  const nodeRadius = 24;
  const nodeSpacingX = 100;
  const nodeSpacingY = 80;
  const branchOffset = 60;
  const startX = 60;
  const startY = 50;
  const width = Math.max(400, startX * 2 + (antallNoder - 1) * nodeSpacingX + branchOffset);
  const height = startY * 2 + nodeSpacingY + branchOffset;

  // Build diagram data
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

  // Calculate positions - main line goes left to right, branches go up/down
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
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3 text-blue-800">Systemdiagram</h2>
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="min-w-full"
          style={{ minWidth: width }}
        >
          {/* Draw pipes first (behind nodes) */}
          {diagramNodes.map((node, index) => {
            if (index === 0) return null;
            
            const fromPos = getNodePosition(index - 1);
            const toPos = getNodePosition(index);
            
            // For branch nodes, draw main line connection + branch
            if (node.is_branch) {
              return (
                <g key={`pipe-${index}`}>
                  {/* Main horizontal pipe (continues the main line) */}
                  <line
                    x1={fromPos.x}
                    y1={fromPos.mainY}
                    x2={toPos.x}
                    y2={toPos.mainY}
                    stroke="#6B7280"
                    strokeWidth={3}
                  />
                  {/* T-junction marker */}
                  <circle
                    cx={toPos.x}
                    cy={toPos.mainY}
                    r={4}
                    fill="#6B7280"
                  />
                  {/* Branch pipe to sprinkler */}
                  <line
                    x1={toPos.x}
                    y1={toPos.mainY}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    strokeDasharray="4,2"
                  />
                  {/* RS label on main pipe */}
                  <text
                    x={(fromPos.x + toPos.x) / 2}
                    y={fromPos.mainY - 8}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    RS{index}
                  </text>
                </g>
              );
            }
            
            // Regular inline node - straight pipe
            return (
              <g key={`pipe-${index}`}>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#6B7280"
                  strokeWidth={3}
                />
                <text
                  x={(fromPos.x + toPos.x) / 2}
                  y={fromPos.y - 8}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  RS{index}
                </text>
              </g>
            );
          })}

          {/* Draw pipe to water supply (after last node) */}
          {diagramNodes.length > 0 && (
            <g>
              <line
                x1={getNodePosition(diagramNodes.length - 1).x}
                y1={getNodePosition(diagramNodes.length - 1).mainY}
                x2={getNodePosition(diagramNodes.length - 1).x + 50}
                y2={getNodePosition(diagramNodes.length - 1).mainY}
                stroke="#6B7280"
                strokeWidth={3}
              />
              <text
                x={getNodePosition(diagramNodes.length - 1).x + 55}
                y={getNodePosition(diagramNodes.length - 1).mainY + 4}
                className="text-xs fill-gray-600 font-medium"
              >
                Vannforsyning
              </text>
            </g>
          )}

          {/* Draw nodes */}
          {diagramNodes.map((node, index) => {
            const pos = getNodePosition(index);
            const isFirst = index === 0;
            
            return (
              <g key={`node-${node.node_nr}`}>
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={isFirst ? "#3B82F6" : node.is_branch ? "#8B5CF6" : "#10B981"}
                  stroke={isFirst ? "#1D4ED8" : node.is_branch ? "#6D28D9" : "#059669"}
                  strokeWidth={2}
                />
                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y - 2}
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  S{node.node_nr}
                </text>
                {/* Flow value */}
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  className="text-[10px] fill-white"
                >
                  {node.flow_lpm.toFixed(0)}
                </text>
                {/* Pressure below node */}
                <text
                  x={pos.x}
                  y={pos.y + nodeRadius + 14}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-600"
                >
                  {node.pressure_bar.toFixed(2)} bar
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(10, ${height - 30})`}>
            <circle cx={8} cy={0} r={6} fill="#3B82F6" />
            <text x={20} y={4} className="text-[10px] fill-gray-600">Første</text>
            <circle cx={70} cy={0} r={6} fill="#10B981" />
            <text x={82} y={4} className="text-[10px] fill-gray-600">Inline</text>
            <circle cx={130} cy={0} r={6} fill="#8B5CF6" />
            <text x={142} y={4} className="text-[10px] fill-gray-600">Grenrør</text>
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
  // General parameters
  const [cFaktor, setCFaktor] = useState(120);
  const [hoydeAnlegg, setHoydeAnlegg] = useState(0);
  const [antallNoder, setAntallNoder] = useState(4);

  // First node (special - includes RS1)
  const [firstNode, setFirstNode] = useState<FirstNodeInput>(
    createDefaultFirstNode()
  );

  // Additional nodes (2-20)
  const [nodes, setNodes] = useState<NodeInput[]>(() =>
    Array.from({ length: 19 }, (_, i) => createDefaultNode(i + 2))
  );

  // Pipe sections (RS 2-20, RS1 is included in firstNode)
  const [rettstrekk, setRettstrekk] = useState<RettsrekkInput[]>(() =>
    Array.from({ length: 19 }, (_, i) => createDefaultRettstrekk(i + 2))
  );

  // Valves
  const [ventiler, setVentiler] = useState<VentilInput[]>(createDefaultVentiler);

  // Results
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update a specific node
  const updateNode = (index: number, node: NodeInput) => {
    const newNodes = [...nodes];
    newNodes[index] = node;
    setNodes(newNodes);
  };

  // Update a specific rettstrekk
  const updateRettstrekk = (index: number, rs: RettsrekkInput) => {
    const newRettstrekk = [...rettstrekk];
    newRettstrekk[index] = rs;
    setRettstrekk(newRettstrekk);
  };

  // Build API request and calculate
  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    // Build nodes array for API
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
        er_tstykke: n.er_grenror_v,
      })),
    ];

    // Build rettstrekk array for API (RS 2 onwards)
    const apiRettstrekk = rettstrekk.slice(0, antallNoder - 1).map((rs) => ({
      rs_nr: rs.rs_nr,
      diameter_mm: rs.diameter_mm,
      lengde_m: rs.lengde_m,
      antall_90_bend: rs.antall_90_bend,
      antall_tstykker: rs.antall_tstykker,
    }));

    // Build ventiler object for API
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
      setError(
        err instanceof Error ? err.message : "Failed to connect to API"
      );
    } finally {
      setLoading(false);
    }
  };

  // Visible nodes (based on antallNoder selection)
  const visibleNodes = nodes.slice(0, antallNoder - 1);
  const visibleRettstrekk = rettstrekk.slice(0, antallNoder - 1);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Sprinkler Calculator
          </h1>
          <p className="text-gray-600 text-sm">
            Hydraulisk beregning av sprinkleranlegg etter NS 12845
          </p>
        </div>

        {/* General Parameters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Generelle Parametre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                C-faktor
              </label>
              <select
                value={cFaktor}
                onChange={(e) => setCFaktor(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={100}>100</option>
                <option value={110}>110</option>
                <option value={120}>120</option>
                <option value={130}>130</option>
                <option value={140}>140</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Høyde anlegg (m)
              </label>
              <input
                type="number"
                value={hoydeAnlegg}
                onChange={(e) => setHoydeAnlegg(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Antall noder
              </label>
              <select
                value={antallNoder}
                onChange={(e) => setAntallNoder(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* First Node + RS1 */}
        <FirstNodeSection node={firstNode} onChange={setFirstNode} />

        {/* Additional Nodes and Rettstrekk */}
        {visibleNodes.map((node, index) => (
          <div key={node.node_nr}>
            <NodeSection
              node={node}
              onChange={(n) => updateNode(index, n)}
            />
            {visibleRettstrekk[index] && (
              <RettsrekkSection
                rettstrekk={visibleRettstrekk[index]}
                onChange={(rs) => updateRettstrekk(index, rs)}
              />
            )}
          </div>
        ))}

        {/* Valve Table */}
        <ValveTable
          ventiler={ventiler}
          onChange={setVentiler}
          antallNoder={antallNoder}
        />

        {/* Calculate Button */}
        <div className="mb-6">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? "Beregner..." : "Beregn Alle Noder"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* System Diagram */}
        <SystemDiagram
          nodes={result?.noder}
          nodeInputs={nodes}
          antallNoder={antallNoder}
        />

        {/* Results */}
        {result && result.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              Beregningsresultater
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-500">Total vannmengde</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.total_vannmengde_lpm?.toFixed(1)} l/min
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-500">Totalt trykk (PQ-krav)</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.total_trykk_bar?.toFixed(3)} Bar
                </div>
              </div>
            </div>

            {/* Node Results Table */}
            <h3 className="font-semibold text-green-800 mb-2">
              Noder (Sprinklerhoder)
            </h3>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Node
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Vannmengde Q
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Trykk
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Kumulativ Q
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.noder?.map((node) => (
                    <tr key={node.node_nr}>
                      <td className="px-4 py-2 text-sm font-medium">
                        S{node.node_nr}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {node.flow_lpm.toFixed(1)} l/min
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {node.pressure_at_node_bar.toFixed(4)} Bar
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {node.cumulative_flow_lpm?.toFixed(1) || "-"} l/min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rettstrekk Results Table */}
            {result.rettstrekk && result.rettstrekk.length > 0 && (
              <>
                <h3 className="font-semibold text-green-800 mb-2">
                  Rettstrekk (Rørføringer)
                </h3>
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          RS
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Trykktap/m
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Totalt trykk
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.rettstrekk.map((rs) => (
                        <tr key={rs.rs_nr}>
                          <td className="px-4 py-2 text-sm font-medium">
                            RS{rs.rs_nr}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rs.pressure_drop_per_m_bar.toFixed(6)} Bar/m
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rs.outlet_pressure_bar.toFixed(4)} Bar
                          </td>
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
            <summary className="cursor-pointer text-gray-500 text-sm">
              Vis rå JSON-resultat
            </summary>
            <pre className="mt-2 bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
