# Helios Docker Test

Week 2 Docker practice for the Team Helios Mini PaaS senior project.

## Purpose

This test demonstrates the basic Docker workflow that will be used in the project:

1. Create a simple Flask web application.
2. Define the application's dependencies.
3. Build the application into a Docker image.
4. Run the image as a Docker container.
5. Map port 8000 from the host to the container.
6. Access the running application through localhost.

## Files

- `app.py` - Simple Flask web application.
- `requirements.txt` - Python dependencies.
- `Dockerfile` - Instructions for building the Docker image.

## Docker Commands

Build the image:

```bash
docker build -t helios-test .