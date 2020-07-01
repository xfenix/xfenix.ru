"""Just deploy script
"""
import os

from fabric import Connection, task


PROJECT_DIR: str = '/srv/www/xfenix.ru/'
BACK_DIR: str = f'{PROJECT_DIR}back/'
SITECON: Connection = Connection(f'{os.getenv("XFENIXRU_USER")}@xfenix.ru', port=os.getenv("XFENIXRU_PORT"))


@task
def deploy(self):
    print('Running deploy...')
    SITECON.run(f'cd {PROJECT_DIR} && git pull')
    print('Done!')


@task
def deployfull(self):
    print('Running full deploy...')
    SITECON.run(f'cd {PROJECT_DIR} && git pull')
    with SITECON.cd(BACK_DIR):
        SITECON.run(f'npx pm2 restart server.js')
    print('Done!')


@task
def install(self):
    print('Installing packages')
    SITECON.run(f'cd {PROJECT_DIR} && git pull')
    with SITECON.cd(BACK_DIR):
        SITECON.run(f'npm i')
    print('Done!')
