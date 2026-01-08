# -*- coding: utf-8 -*-
"""
Sprinkler Calculation Engine
Extracted from Arnulf Snekvik's HovedscriptSprinklerberegning.py

This module contains pure calculation functions with no GUI dependencies.
All functions take dict inputs and return dict outputs.

Original Author: Arnulf Snekvik
Extraction Date: 2026-01-08
"""

import math
from typing import Dict, List, Any, Optional

# =============================================================================
# CONSTANTS AND TABLES (from NS 12845 standard)
# =============================================================================

C_FAKTOR_JUSTERING = {
    100: 0.714,
    110: 0.85,
    120: 1.00,
    130: 1.16,
    140: 1.33
}

EKVIVALENT_RORLENGDE_VENTILER = {
    "Sluseventil": {
        "50": 0.38, "65": 0.51, "80": 0.63, "100": 0.81, 
        "150": 1.1, "200": 1.5, "250": 2.0
    },
    "Alarmventil/tilbakeslagsventil hengslet": {
        "50": 2.4, "65": 3.2, "80": 3.9, "100": 5.1, 
        "150": 7.2, "200": 9.4, "250": 12.0
    },
    "Alarmventil/tilbakeslagsventil membran": {
        "50": 12.0, "65": 19.0, "80": 19.7, "100": 25.0, 
        "150": 35.0, "200": 47.0, "250": 62.0
    },
    "Spjeldventil": {
        "50": 2.2, "65": 2.9, "80": 3.6, "100": 4.6, 
        "150": 6.4, "200": 8.6, "250": 9.9
    },
    "Kuleventil": {
        "50": 16.0, "65": 21.0, "80": 26.0, "100": 34.0, 
        "150": 48.0, "200": 64.0, "250": 84.0
    }
}

# Standard diameters (mm)
DIAMETERE = [20, 25, 32, 40, 50, 65, 80, 100, 150, 200, 250]

# Equivalent lengths for fittings at C=120 (meters)
# Index corresponds to DIAMETERE
EQ_90_BEND = [0.76, 0.77, 1.0, 1.2, 1.5, 1.9, 2.4, 3.0, 4.3, 5.7, 7.4]
EQ_90_BEND_SVEISET = [0.30, 0.36, 0.49, 0.56, 0.69, 0.88, 1.1, 1.4, 2.0, 2.6, 3.4]
EQ_45_BEND = [0.34, 0.40, 0.55, 0.66, 0.76, 1.0, 1.3, 1.6, 2.3, 3.1, 3.9]
EQ_T_STYKKE = [1.3, 1.5, 2.1, 2.4, 2.9, 3.8, 4.8, 6.1, 8.6, 11.0, 14.0]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_nearest_diameter_index(diameter_mm: float) -> int:
    """Find index of nearest standard diameter."""
    nearest = min(DIAMETERE, key=lambda x: abs(x - diameter_mm))
    return DIAMETERE.index(nearest)


def get_c_factor_adjustment(c_faktor: float) -> float:
    """Get C-factor adjustment multiplier for equivalent lengths."""
    c_verdier = [100, 110, 120, 130, 140]
    nearest_c = min(c_verdier, key=lambda x: abs(x - c_faktor))
    return C_FAKTOR_JUSTERING.get(nearest_c, 1.00)


def hazen_williams_pressure_drop(
    flow_lpm: float, 
    c_factor: float, 
    diameter_mm: float
) -> float:
    """
    Calculate pressure drop per meter using Hazen-Williams formula.
    
    Returns pressure drop in Bar per meter.
    """
    if diameter_mm <= 0 or flow_lpm <= 0:
        return 0.0
    
    # Hazen-Williams: p = 6.05 * 10^5 * Q^1.85 / (C^1.85 * D^4.87)
    p_tap_m = (6.05 * 10**5) * (flow_lpm ** 1.85) / ((c_factor ** 1.85) * (diameter_mm ** 4.87))
    return p_tap_m


def calculate_equivalent_length(
    diameter_mm: float,
    c_factor: float,
    num_90_bends: int = 0,
    num_t_pieces: int = 0,
    num_45_bends: int = 0
) -> float:
    """Calculate equivalent pipe length for fittings."""
    d_index = get_nearest_diameter_index(diameter_mm)
    c_adjustment = get_c_factor_adjustment(c_factor)
    
    eq_length = 0.0
    eq_length += num_90_bends * EQ_90_BEND[d_index] * c_adjustment
    eq_length += num_t_pieces * EQ_T_STYKKE[d_index] * c_adjustment
    eq_length += num_45_bends * EQ_45_BEND[d_index] * c_adjustment
    
    return eq_length


def calculate_valve_equivalent_length(
    valve_type: str,
    diameter_str: str,
    c_factor: float
) -> float:
    """Calculate equivalent length for a valve."""
    if valve_type not in EKVIVALENT_RORLENGDE_VENTILER:
        return 0.0
    
    valve_data = EKVIVALENT_RORLENGDE_VENTILER[valve_type]
    if diameter_str not in valve_data or diameter_str == "NA":
        return 0.0
    
    base_length = valve_data[diameter_str]
    c_adjustment = get_c_factor_adjustment(c_factor)
    
    return base_length * c_adjustment


# =============================================================================
# NODE CALCULATION FUNCTIONS
# =============================================================================

def calculate_node_1(
    k_factor: float,
    min_pressure_bar: float,
    coverage_area_m2: float,
    water_requirement_mm_m2: float,
    pipe_diameter_mm: float,
    pipe_length_m: float,
    c_factor: float,
    num_90_bends: int = 0,
    num_t_pieces: int = 0
) -> Dict[str, Any]:
    """
    Calculate the first sprinkler node (furthest from water supply).
    
    This is the starting point. RS1 is the pipe from sprinkler 1 to node 2.
    """
    # Calculate flow from K-factor: Q = K * sqrt(P)
    flow_from_k = k_factor * math.sqrt(min_pressure_bar)
    
    # Calculate flow from water requirement: Q = density * area
    flow_from_requirement = water_requirement_mm_m2 * coverage_area_m2
    
    # Use the larger of the two flows
    flow_lpm = max(flow_from_k, flow_from_requirement)
    
    # Calculate actual required pressure from flow: P = (Q/K)²
    actual_pressure_bar = (flow_lpm / k_factor) ** 2
    pressure_at_node = max(actual_pressure_bar, min_pressure_bar)
    
    # Calculate equivalent length for fittings in RS1
    eq_length = calculate_equivalent_length(
        pipe_diameter_mm, c_factor, num_90_bends, num_t_pieces
    )
    total_length = pipe_length_m + eq_length
    
    # Calculate pressure drop per meter
    pressure_drop_per_m = hazen_williams_pressure_drop(flow_lpm, c_factor, pipe_diameter_mm)
    
    # Pressure at inlet of RS1 (node 2 side)
    pressure_after_rs1 = pressure_at_node + (pressure_drop_per_m * total_length)
    
    return {
        "node_nr": 1,
        "flow_lpm": round(flow_lpm, 2),
        "pressure_at_node_bar": round(pressure_at_node, 4),
        "pressure_drop_per_m_bar": round(pressure_drop_per_m, 6),
        "equivalent_length_m": round(eq_length, 2),
        "total_length_m": round(total_length, 2),
        "pressure_after_rs1_bar": round(pressure_after_rs1, 4),
        "cumulative_flow_lpm": round(flow_lpm, 2),
        # RS1 result embedded
        "rs1": {
            "rs_nr": 1,
            "diameter_mm": pipe_diameter_mm,
            "physical_length_m": round(pipe_length_m, 2),
            "equivalent_length_m": round(eq_length, 2),
            "total_length_m": round(total_length, 2),
            "flow_lpm": round(flow_lpm, 2),
            "pressure_drop_per_m_bar": round(pressure_drop_per_m, 6),
            "inlet_pressure_bar": round(pressure_at_node, 4),
            "outlet_pressure_bar": round(pressure_after_rs1, 4)
        }
    }


def calculate_node_inline(
    node_nr: int,
    k_factor: float,
    inlet_pressure_bar: float,
    c_factor: float,
    cumulative_flow_before: float
) -> Dict[str, Any]:
    """
    Calculate an inline node (not on a branch pipe).
    
    Uses the inlet pressure to determine flow: Q = K * sqrt(P)
    """
    flow_lpm = k_factor * math.sqrt(inlet_pressure_bar)
    cumulative_flow = cumulative_flow_before + flow_lpm
    
    return {
        "node_nr": node_nr,
        "flow_lpm": round(flow_lpm, 2),
        "pressure_at_node_bar": round(inlet_pressure_bar, 4),
        "k_factor_used": k_factor,
        "is_branch": False,
        "cumulative_flow_lpm": round(cumulative_flow, 2)
    }


def calculate_node_branch(
    node_nr: int,
    k_factor: float,
    inlet_pressure_bar: float,
    min_pressure_bar: float,
    c_factor: float,
    branch_diameter_mm: float,
    branch_length_m: float,
    num_90_bends: int,
    num_t_pieces: int,
    cumulative_flow_before: float,
    use_equivalent_k: bool = False
) -> Dict[str, Any]:
    """
    Calculate a branch node (grenrør).
    
    The sprinkler is on a side pipe (branch) that connects to the main.
    We calculate an equivalent K-factor that accounts for the branch pipe losses.
    
    Logic:
    1. At minimum pressure (e.g., 0.5 bar), flow = K * sqrt(min_p)
    2. This flow through the branch causes a pressure drop
    3. Pressure at the T-junction must be higher to deliver min_p at sprinkler
    4. Equivalent K-factor = flow / sqrt(pressure_at_junction)
    5. Actual flow uses inlet_pressure_bar with equivalent K
    """
    if branch_diameter_mm <= 0:
        # No branch pipe defined, treat as inline
        return calculate_node_inline(node_nr, k_factor, inlet_pressure_bar, c_factor, cumulative_flow_before)
    
    # Calculate equivalent length for branch fittings
    eq_length = calculate_equivalent_length(
        branch_diameter_mm, c_factor, num_90_bends, num_t_pieces
    )
    total_branch_length = branch_length_m + eq_length
    
    if use_equivalent_k and total_branch_length > 0:
        # Equivalent K-factor method
        # Step 1: Flow at minimum pressure
        flow_at_min_p = k_factor * math.sqrt(min_pressure_bar)
        
        # Step 2: Pressure drop in branch at this flow
        p_drop_m = hazen_williams_pressure_drop(flow_at_min_p, c_factor, branch_diameter_mm)
        branch_pressure_drop = p_drop_m * total_branch_length
        
        # Step 3: Required pressure at T-junction (main pipe)
        pressure_at_junction = min_pressure_bar + branch_pressure_drop
        
        # Step 4: Equivalent K-factor
        k_equivalent = flow_at_min_p / math.sqrt(pressure_at_junction)
        
        # Step 5: Actual flow using inlet pressure with equivalent K
        flow_lpm = k_equivalent * math.sqrt(inlet_pressure_bar)
        
        cumulative_flow = cumulative_flow_before + flow_lpm
        
        return {
            "node_nr": node_nr,
            "flow_lpm": round(flow_lpm, 2),
            "pressure_at_node_bar": round(inlet_pressure_bar, 4),
            "k_factor_original": k_factor,
            "k_equivalent": round(k_equivalent, 2),
            "branch_length_m": round(total_branch_length, 2),
            "branch_pressure_drop_bar": round(branch_pressure_drop, 4),
            "is_branch": True,
            "cumulative_flow_lpm": round(cumulative_flow, 2)
        }
    else:
        # Simple branch (not using equivalent K) - just use inlet pressure
        flow_lpm = k_factor * math.sqrt(inlet_pressure_bar)
        cumulative_flow = cumulative_flow_before + flow_lpm
        
        return {
            "node_nr": node_nr,
            "flow_lpm": round(flow_lpm, 2),
            "pressure_at_node_bar": round(inlet_pressure_bar, 4),
            "k_factor_used": k_factor,
            "branch_length_m": round(total_branch_length, 2),
            "is_branch": True,
            "cumulative_flow_lpm": round(cumulative_flow, 2)
        }


def calculate_pipe_section(
    rs_nr: int,
    diameter_mm: float,
    length_m: float,
    flow_lpm: float,
    inlet_pressure_bar: float,
    c_factor: float,
    num_90_bends: int = 0,
    num_t_pieces: int = 0,
    valve_equivalent_length_m: float = 0.0
) -> Dict[str, Any]:
    """
    Calculate pressure drop through a pipe section (Rettstrekk).
    
    RS N connects node N to node N+1.
    Flow is the cumulative flow at node N.
    """
    if diameter_mm <= 0 or flow_lpm <= 0:
        return {
            "rs_nr": rs_nr,
            "diameter_mm": diameter_mm,
            "physical_length_m": round(length_m, 2),
            "equivalent_length_m": 0.0,
            "total_length_m": round(length_m, 2),
            "flow_lpm": 0.0,
            "pressure_drop_per_m_bar": 0.0,
            "pressure_drop_total_bar": 0.0,
            "inlet_pressure_bar": round(inlet_pressure_bar, 4),
            "outlet_pressure_bar": round(inlet_pressure_bar, 4)
        }
    
    # Calculate equivalent length for fittings
    eq_length = calculate_equivalent_length(
        diameter_mm, c_factor, num_90_bends, num_t_pieces
    )
    
    # Total equivalent length including valves
    total_length = length_m + eq_length + valve_equivalent_length_m
    
    # Calculate pressure drop
    pressure_drop_per_m = hazen_williams_pressure_drop(flow_lpm, c_factor, diameter_mm)
    pressure_drop_total = pressure_drop_per_m * total_length
    
    # Outlet pressure (towards water supply)
    outlet_pressure_bar = inlet_pressure_bar + pressure_drop_total
    
    return {
        "rs_nr": rs_nr,
        "diameter_mm": diameter_mm,
        "physical_length_m": round(length_m, 2),
        "equivalent_length_m": round(eq_length + valve_equivalent_length_m, 2),
        "total_length_m": round(total_length, 2),
        "flow_lpm": round(flow_lpm, 2),
        "pressure_drop_per_m_bar": round(pressure_drop_per_m, 6),
        "pressure_drop_total_bar": round(pressure_drop_total, 4),
        "inlet_pressure_bar": round(inlet_pressure_bar, 4),
        "outlet_pressure_bar": round(outlet_pressure_bar, 4)
    }


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def calculate_sprinkler_system(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main calculation function for sprinkler system.
    
    System layout:
    - Node 1 is the furthest sprinkler
    - RS1 connects Node 1 to Node 2
    - Each subsequent RS connects its node to the next
    - Water flows from supply → last RS → ... → RS1 → Node 1
    
    Calculation direction:
    - Start at Node 1 with minimum pressure
    - Work backwards towards supply, adding pressure drops
    """
    try:
        # Extract general parameters
        params = input_data.get("generelle_parametre", {})
        c_factor = float(params.get("c_faktor", 120))
        building_height_m = float(params.get("hoyde_anlegg_m", 0))
        
        # Calculate valve equivalent lengths per pipe section
        ventiler = input_data.get("ventiler", {})
        valve_eq_per_rs = {}
        total_valve_eq_length = 0.0
        for valve_name, valve_data in ventiler.items():
            dim = valve_data.get("dimensjon", "NA")
            rs_nr = int(valve_data.get("tilkoblet_rs", 0))
            if dim != "NA" and rs_nr > 0:
                eq_len = calculate_valve_equivalent_length(valve_name, dim, c_factor)
                valve_eq_per_rs[rs_nr] = valve_eq_per_rs.get(rs_nr, 0) + eq_len
                total_valve_eq_length += eq_len
        
        # Get and sort nodes
        noder = input_data.get("noder", [])
        noder = sorted(noder, key=lambda x: x.get("node_nr", 0))
        
        # Get pipe sections (RS2 onwards - RS1 is in node 1)
        rettstrekk = input_data.get("rettstrekk", [])
        rettstrekk = sorted(rettstrekk, key=lambda x: x.get("rs_nr", 0))
        
        # Create lookup dict for rettstrekk by number
        rs_dict = {rs.get("rs_nr"): rs for rs in rettstrekk}
        
        # Results
        node_results = []
        rs_results = []
        
        # STEP 1: Calculate Node 1 and RS1
        if not noder:
            return {"success": False, "error": "No nodes provided"}
        
        node_1_data = noder[0]
        if node_1_data.get("node_nr") != 1:
            return {"success": False, "error": "First node must be node_nr=1"}
        
        node_1_result = calculate_node_1(
            k_factor=float(node_1_data.get("k_faktor", 80)),
            min_pressure_bar=float(node_1_data.get("min_trykk_bar", 0.5)),
            coverage_area_m2=float(node_1_data.get("dekningsareal_m2", 12)),
            water_requirement_mm_m2=float(node_1_data.get("krav_mm_m2", 5)),
            pipe_diameter_mm=float(node_1_data.get("diameter_mm", 27.3)),
            pipe_length_m=float(node_1_data.get("lengde_m", 0)),
            c_factor=c_factor,
            num_90_bends=int(node_1_data.get("antall_90_bend", 0)),
            num_t_pieces=int(node_1_data.get("antall_tstykker", 0))
        )
        node_results.append(node_1_result)
        rs_results.append(node_1_result["rs1"])
        
        # Track cumulative flow and current pressure
        cumulative_flow = node_1_result["flow_lpm"]
        current_pressure = node_1_result["pressure_after_rs1_bar"]
        
        # STEP 2: Calculate remaining nodes (2, 3, 4, ...)
        for i, node_data in enumerate(noder[1:], start=2):
            node_nr = node_data.get("node_nr", i)
            
            # Check if this is a branch node
            is_branch = node_data.get("er_grenror", False)
            use_ekv_k = node_data.get("er_ekv_kfaktor", False)
            
            if is_branch:
                node_result = calculate_node_branch(
                    node_nr=node_nr,
                    k_factor=float(node_data.get("k_faktor", 80)),
                    inlet_pressure_bar=current_pressure,
                    min_pressure_bar=float(node_data.get("min_trykk_bar", 0.5)),
                    c_factor=c_factor,
                    branch_diameter_mm=float(node_data.get("diameter_mm", 27.3)),
                    branch_length_m=float(node_data.get("lengde_m", 0)),
                    num_90_bends=int(node_data.get("antall_90_bend", 0)),
                    num_t_pieces=int(node_data.get("antall_tstykker", 1)),
                    cumulative_flow_before=cumulative_flow,
                    use_equivalent_k=use_ekv_k
                )
            else:
                node_result = calculate_node_inline(
                    node_nr=node_nr,
                    k_factor=float(node_data.get("k_faktor", 80)),
                    inlet_pressure_bar=current_pressure,
                    c_factor=c_factor,
                    cumulative_flow_before=cumulative_flow
                )
            
            node_results.append(node_result)
            cumulative_flow = node_result["cumulative_flow_lpm"]
            
            # STEP 3: Calculate RS for this node (RS N connects node N to node N+1)
            rs_nr = node_nr
            rs_data = rs_dict.get(rs_nr, {})
            
            if rs_data:
                rs_result = calculate_pipe_section(
                    rs_nr=rs_nr,
                    diameter_mm=float(rs_data.get("diameter_mm", 36)),
                    length_m=float(rs_data.get("lengde_m", 0)),
                    flow_lpm=cumulative_flow,
                    inlet_pressure_bar=current_pressure,
                    c_factor=c_factor,
                    num_90_bends=int(rs_data.get("antall_90_bend", 0)),
                    num_t_pieces=int(rs_data.get("antall_tstykker", 0)),
                    valve_equivalent_length_m=valve_eq_per_rs.get(rs_nr, 0)
                )
                rs_results.append(rs_result)
                current_pressure = rs_result["outlet_pressure_bar"]
        
        # STEP 4: Add height adjustment (0.1 bar per meter)
        height_pressure = building_height_m * 0.1
        total_pressure = current_pressure + height_pressure
        
        return {
            "success": True,
            "c_faktor": c_factor,
            "hoyde_anlegg_m": building_height_m,
            "hoyde_tillegg_bar": round(height_pressure, 3),
            "noder": node_results,
            "rettstrekk": rs_results,
            "total_vannmengde_lpm": round(cumulative_flow, 1),
            "total_trykk_bar": round(total_pressure, 3),
            "ventil_ekvivalent_lengde": round(total_valve_eq_length, 2)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }


# =============================================================================
# TEST
# =============================================================================

if __name__ == "__main__":
    test_input = {
        "generelle_parametre": {
            "c_faktor": 120,
            "hoyde_anlegg_m": 0
        },
        "noder": [
            {
                "node_nr": 1,
                "k_faktor": 80,
                "min_trykk_bar": 0.5,
                "dekningsareal_m2": 12,
                "krav_mm_m2": 5,
                "diameter_mm": 27.3,
                "lengde_m": 3,
                "antall_90_bend": 0,
                "antall_tstykker": 0
            },
            {
                "node_nr": 2,
                "k_faktor": 80,
                "er_grenror": False,
                "diameter_mm": 27.3,
                "lengde_m": 0,
                "antall_90_bend": 0,
                "antall_tstykker": 1
            },
            {
                "node_nr": 3,
                "k_faktor": 80,
                "er_grenror": True,
                "er_ekv_kfaktor": True,
                "diameter_mm": 27.3,
                "lengde_m": 2,
                "antall_90_bend": 1,
                "antall_tstykker": 1
            },
            {
                "node_nr": 4,
                "k_faktor": 80,
                "er_grenror": False,
                "diameter_mm": 27.3,
                "lengde_m": 0,
                "antall_90_bend": 0,
                "antall_tstykker": 1
            }
        ],
        "rettstrekk": [
            {
                "rs_nr": 2,
                "diameter_mm": 36,
                "lengde_m": 4,
                "antall_90_bend": 0,
                "antall_tstykker": 0
            },
            {
                "rs_nr": 3,
                "diameter_mm": 36,
                "lengde_m": 4,
                "antall_90_bend": 0,
                "antall_tstykker": 0
            },
            {
                "rs_nr": 4,
                "diameter_mm": 42,
                "lengde_m": 5,
                "antall_90_bend": 1,
                "antall_tstykker": 0
            }
        ],
        "ventiler": {}
    }
    
    result = calculate_sprinkler_system(test_input)
    
    import json
    print(json.dumps(result, indent=2))
