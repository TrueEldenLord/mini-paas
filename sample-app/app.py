from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "<h1>Hello from the Mini PaaS!</h1><p>Phase 1 proof of concept.</p>"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
