from flask import Flask

from application.web.routes import web_bp


def create_app():
    """Create and configure the Flask application."""
    app = Flask(
        __name__,
        template_folder="web/templates",
        static_folder="web/static",
        static_url_path="/static"
    )

    app.register_blueprint(web_bp)

    return app


app = create_app()


if __name__ == "__main__":
    import os

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
