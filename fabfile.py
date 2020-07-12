"""Just deploy script
"""
import os

from fabric import Connection, task


PROJECT_DIR: str = "/srv/www/xfenix.ru/"
BACK_DIR: str = f"{PROJECT_DIR}back/"
SITECON: Connection = Connection(f'{os.getenv("XFENIXRU_USER")}@xfenix.ru', port=os.getenv("XFENIXRU_PORT"))


def restart_back():
    with SITECON.cd(BACK_DIR):
        SITECON.run(f"npx pm2 restart server.js")


@task
def deploy(context):
    print("Running deploy...")
    SITECON.run(f"cd {PROJECT_DIR} && git pull")
    print("Done!")


@task
def deployfull(context):
    print("Running full deploy...")
    SITECON.run(f"cd {PROJECT_DIR} && git pull")
    restart_back()
    print("Done!")


@task
def install(context):
    print("Installing packages")
    SITECON.run(f"cd {PROJECT_DIR} && git pull")
    with SITECON.cd(BACK_DIR):
        SITECON.run(f"npm i")
    print("Done!")


@task
def clean_cache(context):
    print("Clean cache")
    SITECON.run(f"cd {PROJECT_DIR}/back/ && rm store.json 2> /dev/null")
    restart_back()
    print("Done!")
