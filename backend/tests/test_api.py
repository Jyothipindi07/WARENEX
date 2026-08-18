"""
WARENEX API Test Suite
Covers all major endpoints using a real SQLite in-memory-style test DB.
Run with: pytest backend/tests/test_api.py -v
"""
import sys
import os
import sqlite3
import json
import pytest

# Ensure the project root is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def app():
    """Create test Flask app using the real backend."""
    from backend.app import app as flask_app
    flask_app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,
    })
    yield flask_app


@pytest.fixture(scope="session")
def client(app):
    """Test client for the Flask app."""
    return app.test_client()


# ── Dashboard Endpoint ─────────────────────────────────────────────────────────

class TestDashboard:
    def test_dashboard_returns_200(self, client):
        resp = client.get("/api/dashboard")
        assert resp.status_code == 200

    def test_dashboard_has_health_score(self, client):
        data = client.get("/api/dashboard").get_json()
        assert "health_score" in data
        assert isinstance(data["health_score"], int)
        assert 0 <= data["health_score"] <= 100

    def test_dashboard_has_kpis(self, client):
        data = client.get("/api/dashboard").get_json()
        assert "kpis" in data
        kpis = data["kpis"]
        assert "orders_today" in kpis
        assert "fulfillment_rate" in kpis
        assert "inventory_health" in kpis
        assert "active_exceptions" in kpis

    def test_dashboard_has_pipeline(self, client):
        data = client.get("/api/dashboard").get_json()
        assert "pipeline" in data
        pipeline = data["pipeline"]
        expected_stages = ["NEW", "ALLOCATED", "PICKING", "PACKING", "QC", "DISPATCHED"]
        for stage in expected_stages:
            assert stage in pipeline

    def test_dashboard_has_action_center(self, client):
        data = client.get("/api/dashboard").get_json()
        assert "action_center" in data
        assert isinstance(data["action_center"], list)

    def test_dashboard_has_next_best_actions(self, client):
        data = client.get("/api/dashboard").get_json()
        assert "next_best_actions" in data

    def test_dashboard_has_decision_history(self, client):
        data = client.get("/api/dashboard").get_json()
        assert "decision_history" in data
        assert isinstance(data["decision_history"], list)


# ── Orders Endpoints ───────────────────────────────────────────────────────────

class TestOrders:
    def test_orders_returns_200(self, client):
        resp = client.get("/api/orders")
        assert resp.status_code == 200

    def test_orders_returns_list(self, client):
        data = client.get("/api/orders").get_json()
        assert isinstance(data, list)

    def test_orders_each_has_required_fields(self, client):
        data = client.get("/api/orders").get_json()
        if data:
            order = data[0]
            for field in ["id", "customer", "value", "status", "priority", "risk"]:
                assert field in order, f"Missing field: {field}"

    def test_orders_filter_by_status(self, client):
        resp = client.get("/api/orders?status=New")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        for order in data:
            assert order["status"] == "New"

    def test_orders_search(self, client):
        resp = client.get("/api/orders?search=ORD")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)


# ── Inventory Endpoints ────────────────────────────────────────────────────────

class TestInventory:
    def test_inventory_returns_200(self, client):
        resp = client.get("/api/inventory")
        assert resp.status_code == 200

    def test_inventory_has_products(self, client):
        data = client.get("/api/inventory").get_json()
        assert "products" in data
        assert isinstance(data["products"], list)

    def test_inventory_products_have_health_status(self, client):
        data = client.get("/api/inventory").get_json()
        if data.get("products"):
            product = data["products"][0]
            assert "stock_health" in product
            assert product["stock_health"] in ["Healthy", "Low Stock", "Out of Stock", "Damaged"]

    def test_inventory_has_metrics(self, client):
        data = client.get("/api/inventory").get_json()
        # API returns either 'metrics' or 'summary' depending on version
        assert "summary" in data or "metrics" in data
        summary = data.get("summary") or data.get("metrics")
        assert isinstance(summary, dict)
        assert len(summary) > 0


# ── Exceptions Endpoints ───────────────────────────────────────────────────────

class TestExceptions:
    def test_exceptions_returns_200(self, client):
        resp = client.get("/api/exceptions")
        assert resp.status_code == 200

    def test_exceptions_returns_list(self, client):
        data = client.get("/api/exceptions").get_json()
        assert isinstance(data, list)

    def test_exceptions_have_required_fields(self, client):
        data = client.get("/api/exceptions").get_json()
        if data:
            exc = data[0]
            for field in ["id", "type", "severity", "status"]:
                assert field in exc, f"Missing field: {field}"


# ── Picking Batch Optimization ─────────────────────────────────────────────────

class TestPickingBatch:
    def test_batch_optimize_returns_200(self, client):
        resp = client.post("/api/picking/batch")
        assert resp.status_code == 200

    def test_batch_optimize_has_travel_reduction(self, client):
        data = client.post("/api/picking/batch").get_json()
        assert "travel_reduction_pct" in data
        assert isinstance(data["travel_reduction_pct"], (int, float))

    def test_batch_optimize_has_success_flag(self, client):
        data = client.post("/api/picking/batch").get_json()
        assert "success" in data
        assert data["success"] is True


# ── Intelligence Chat Endpoint ─────────────────────────────────────────────────

class TestIntelligenceChat:
    def test_chat_returns_200_with_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "What should I do right now?"},
            content_type="application/json"
        )
        assert resp.status_code == 200

    def test_chat_returns_response_field(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "Which orders are at risk?"},
            content_type="application/json"
        )
        data = resp.get_json()
        assert "response" in data
        assert isinstance(data["response"], str)
        assert len(data["response"]) > 0

    def test_chat_handles_low_stock_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "Which products need replenishment?"},
            content_type="application/json"
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "response" in data

    def test_chat_handles_typo_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "what is low shock"},
            content_type="application/json"
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "response" in data

    def test_chat_rejects_empty_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": ""},
            content_type="application/json"
        )
        assert resp.status_code == 400

    def test_chat_rejects_missing_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={},
            content_type="application/json"
        )
        assert resp.status_code == 400

    def test_chat_handles_health_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "What is the warehouse health score?"},
            content_type="application/json"
        )
        assert resp.status_code == 200

    def test_chat_handles_exception_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "Show active exceptions"},
            content_type="application/json"
        )
        assert resp.status_code == 200


# ── Notifications Endpoint ─────────────────────────────────────────────────────

class TestNotifications:
    def test_notifications_returns_200(self, client):
        resp = client.get("/api/notifications")
        assert resp.status_code == 200

    def test_notifications_returns_list(self, client):
        data = client.get("/api/notifications").get_json()
        assert isinstance(data, list)


# ── Security Headers ───────────────────────────────────────────────────────────

class TestSecurityHeaders:
    def test_x_content_type_options_header(self, client):
        resp = client.get("/api/dashboard")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"

    def test_x_frame_options_header(self, client):
        resp = client.get("/api/dashboard")
        assert resp.headers.get("X-Frame-Options") == "DENY"

    def test_x_xss_protection_header(self, client):
        resp = client.get("/api/dashboard")
        assert "X-XSS-Protection" in resp.headers

    def test_referrer_policy_header(self, client):
        resp = client.get("/api/dashboard")
        assert "Referrer-Policy" in resp.headers


# ── Analytics Endpoint ─────────────────────────────────────────────────────────

class TestAnalytics:
    def test_analytics_returns_200(self, client):
        resp = client.get("/api/analytics")
        assert resp.status_code == 200

    def test_analytics_has_required_keys(self, client):
        data = client.get("/api/analytics").get_json()
        assert isinstance(data, dict)
        # Should contain at least some analytics data
        assert len(data) > 0


# ── Input Validation ───────────────────────────────────────────────────────────

class TestInputValidation:
    def test_chat_rejects_oversized_query(self, client):
        resp = client.post(
            "/api/intelligence/chat",
            json={"query": "x" * 600},
            content_type="application/json"
        )
        assert resp.status_code == 400

    def test_order_detail_invalid_id_returns_404(self, client):
        resp = client.get("/api/orders/INVALID-ID-99999")
        assert resp.status_code == 404

    def test_prioritize_invalid_order_returns_error(self, client):
        resp = client.post("/api/orders/FAKE-0000/prioritize")
        assert resp.status_code in [404, 400, 500]
