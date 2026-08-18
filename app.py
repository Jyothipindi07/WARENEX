from pathlib import Path
import sys
import os

# Locate directories
root_dir = Path(__file__).resolve().parent
frontend_dist_index = root_dir / "frontend" / "dist" / "index.html"

if not frontend_dist_index.exists():
    print("================================================================")
    print("WARNING: WARENEX Frontend production build was not found!")
    print("Please build the React application by running the following once:")
    print("  cd frontend")
    print("  npm install")
    print("  npm run build")
    print("================================================================")

# Add backend directory to import search path
sys.path.append(str(root_dir / "backend"))

try:
    from backend.app import app
except Exception as e:
    print(f"Error importing backend application: {e}")
    sys.exit(1)

if __name__ == '__main__':
    # Print clean startup banner
    print("========================================")
    print("WARENEX")
    print("Intelligent Warehouse Decision System")
    print("Frontend + Backend:")
    print("  http://127.0.0.1:5000/")
    print("API:")
    print("  http://127.0.0.1:5000/api/dashboard")
    print("Press CTRL+C to stop the server.")
    print("========================================")
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
