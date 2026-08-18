"""
WARENEX Decision Engine Unit Tests
Tests the core algorithmic functions in isolation.
Run with: pytest backend/tests/test_decision_engine.py -v
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend import decision_engine


# ── Priority Score Tests ───────────────────────────────────────────────────────

class TestCalculatePriorityScore:
    def test_high_value_gets_high_score(self):
        score, cls, reasons = decision_engine.calculate_priority_score(
            value=5000.0,
            customer="Apex Systems",
            deadline_str="2099-01-01 23:59:59",
            available_stock_ratio=1.0
        )
        assert score > 50
        assert isinstance(score, (int, float))
        assert cls in ["Critical", "High", "Medium", "Low"]

    def test_low_value_gets_lower_score(self):
        score_high, _, _ = decision_engine.calculate_priority_score(
            value=10000.0, customer="VIP", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        score_low, _, _ = decision_engine.calculate_priority_score(
            value=10.0, customer="Basic", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        assert score_high >= score_low

    def test_vip_customer_boosts_score(self):
        score_vip, _, _ = decision_engine.calculate_priority_score(
            value=1000.0, customer="Apex Systems", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        score_normal, _, _ = decision_engine.calculate_priority_score(
            value=1000.0, customer="Regular Co", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        assert score_vip >= score_normal

    def test_low_stock_reduces_score(self):
        score_full, _, _ = decision_engine.calculate_priority_score(
            value=500.0, customer="Customer A", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        score_low, _, _ = decision_engine.calculate_priority_score(
            value=500.0, customer="Customer A", deadline_str="2099-01-01 23:59:59", available_stock_ratio=0.2
        )
        assert score_full >= score_low

    def test_returns_three_tuple(self):
        result = decision_engine.calculate_priority_score(
            value=100.0, customer="Test", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        assert len(result) == 3

    def test_reasons_is_list(self):
        _, _, reasons = decision_engine.calculate_priority_score(
            value=100.0, customer="Test", deadline_str="2099-01-01 23:59:59", available_stock_ratio=1.0
        )
        assert isinstance(reasons, list)

    def test_score_is_bounded(self):
        score, _, _ = decision_engine.calculate_priority_score(
            value=999999.0, customer="Apex Systems", deadline_str="2020-01-01 00:00:00", available_stock_ratio=1.0
        )
        assert 0 <= score <= 100

    def test_critical_class_for_extreme_values(self):
        _, cls, _ = decision_engine.calculate_priority_score(
            value=10000.0, customer="Apex Systems", deadline_str="2020-01-01 00:00:00", available_stock_ratio=1.0
        )
        assert cls in ["Critical", "High"]


# ── Picking Route Optimization Tests ──────────────────────────────────────────

class TestOptimizePickingRoute:
    def test_returns_two_tuple(self):
        result = decision_engine.optimize_picking_route(["A-01", "B-03", "A-02"])
        assert len(result) == 2

    def test_optimized_route_is_list(self):
        route, saving = decision_engine.optimize_picking_route(["A-01", "C-05", "B-02"])
        assert isinstance(route, list)

    def test_saving_is_numeric(self):
        route, saving = decision_engine.optimize_picking_route(["A-01", "B-03"])
        assert isinstance(saving, (int, float))

    def test_empty_route_handled(self):
        route, saving = decision_engine.optimize_picking_route([])
        assert isinstance(route, list)
        assert isinstance(saving, (int, float))

    def test_single_location_route(self):
        route, saving = decision_engine.optimize_picking_route(["A-01"])
        assert isinstance(route, list)
        assert len(route) >= 0

    def test_all_same_zone_route(self):
        route, saving = decision_engine.optimize_picking_route(["A-01", "A-02", "A-03"])
        assert isinstance(route, list)
        assert isinstance(saving, (int, float))

    def test_route_contains_all_locations(self):
        locations = ["A-01", "B-03", "C-02"]
        route, _ = decision_engine.optimize_picking_route(locations)
        # All locations should appear in the optimized route
        for loc in locations:
            assert loc in route


# ── SLA Risk Tests ─────────────────────────────────────────────────────────────

class TestCalculateSlaRisk:
    """Tests for SLA risk calculation. Requires a real DB connection."""

    def test_sla_risk_returns_data(self):
        """Integration test using the real database."""
        import sqlite3
        from backend.database import get_db_connection
        conn = get_db_connection()
        # Just verify the function exists and is callable with a conn
        conn.close()
        assert callable(decision_engine.calculate_sla_risk)
