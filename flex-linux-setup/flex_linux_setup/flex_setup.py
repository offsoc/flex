#!/usr/bin/python3

import sys
import os
import zipfile
import argparse
import time
import glob
from urllib.parse import urljoin

if not os.path.join('/etc/jans/conf/jans.properties'):
    print("Please install Jans server then execute this script.")
    sys.exit()

if not os.path.exists('/opt/jans/jetty/jans-config-api/start.ini'):
    print("Please install Jans Config Api then execute this script.")
    sys.exit()

__STATIC_SETUP_DIR__ = '/opt/jans/jans-setup/'

try:
    import jans_setup
    sys.path.append(jans_setup.__path__[0])
except ModuleNotFoundError:
    if os.path.exists(__STATIC_SETUP_DIR__):
        sys.path.append(__STATIC_SETUP_DIR__)
    else:
        print("Unable to locate jans-setup, exiting ...")
        sys.exit()

logs_dir = os.path.join(__STATIC_SETUP_DIR__, 'logs')

if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

from setup_app import paths
paths.LOG_FILE = os.path.join(logs_dir, 'flex-setup.log')
paths.LOG_ERROR_FILE = os.path.join(logs_dir, 'flex-setup-error.log')
print()
print("Log Files:")
print('\033[1m')
print(paths.LOG_FILE)
print(paths.LOG_ERROR_FILE)
print('\033[0m')

from setup_app import static
from setup_app.utils import base

from setup_app.utils.package_utils import packageUtils
from setup_app.config import Config
from setup_app.utils.collect_properties import CollectProperties
from setup_app.installers.node import NodeInstaller
from setup_app.installers.httpd import HttpdInstaller
from setup_app.installers.config_api import ConfigApiInstaller
from setup_app.installers.jetty import JettyInstaller
from setup_app.installers.jans_auth import JansAuthInstaller


Config.outputFolder = os.path.join(__STATIC_SETUP_DIR__, 'output')
if not os.path.join(Config.outputFolder):
    os.makedirs(Config.outputFolder)

parser = argparse.ArgumentParser(description="This script downloads Gluu Admin UI components and installs")
parser.add_argument('--setup-branch', help="Jannsen setup github branch", default='main')
parser.add_argument('--flex-branch', help="Jannsen flex setup github branch", default='main')
parser.add_argument('--jans-branch', help="Jannsen github branch", default='main')
parser.add_argument('-casa-integration', help="Install Casa Integration", action='store_true')

argsp = parser.parse_args()

# initialize config object
Config.init(paths.INSTALL_DIR)
Config.determine_version()

collectProperties = CollectProperties()
collectProperties.collect()

maven_base_url = 'https://jenkins.jans.io/maven/io/jans/'
app_versions = {
  "SETUP_BRANCH": argsp.setup_branch,
  "FLEX_BRANCH": argsp.flex_branch,
  "JANS_BRANCH": argsp.jans_branch,
  "JANS_APP_VERSION": "1.0.0",
  "JANS_BUILD": "-SNAPSHOT", 
  "NODE_VERSION": "v14.18.2",
  "CASA_VERSION": "5.0.0-SNAPSHOT",
  "TWILIO_VERSION": "7.17.0",
}

node_installer = NodeInstaller()
httpd_installer = HttpdInstaller()
config_api_installer = ConfigApiInstaller()
jansAuthInstaller = JansAuthInstaller()


class flex_installer(JettyInstaller):


    def __init__(self):

        self.gluu_admin_ui_source_path = os.path.join(Config.distJansFolder, 'gluu-admin-ui.zip')
        self.log4j2_adminui_path = os.path.join(Config.distJansFolder, 'log4j2-adminui.xml')
        self.log4j2_path = os.path.join(Config.distJansFolder, 'log4j2.xml')
        self.admin_ui_plugin_source_path = os.path.join(Config.distJansFolder, 'admin-ui-plugin-distribution.jar')
        self.flex_path = os.path.join(Config.distJansFolder, 'flex.zip')
        self.source_dir = os.path.join(Config.outputFolder, 'admin-ui')
        self.flex_setup_dir = os.path.join(self.source_dir, 'flex-linux-setup')
        self.templates_dir = os.path.join(self.flex_setup_dir, 'templates')
        self.admin_ui_config_properties_path = os.path.join(self.templates_dir, 'auiConfiguration.properties')
        self.casa_dist_dir = os.path.join(Config.distJansFolder, 'gluu-casa')
        self.casa_web_resources_fn = os.path.join(self.casa_dist_dir, 'casa_web_resources.xml')
        self.casa_war_fn = os.path.join(self.casa_dist_dir, 'casa.war')
        self.casa_config_fn = os.path.join(self.casa_dist_dir,'casa-config.jar')
        self.casa_script_fn = os.path.join(self.casa_dist_dir,'Casa.py')
        self.twillo_fn = os.path.join(self.casa_dist_dir,'twilio.jar')
        self.py_lib_dir = '/opt/gluu/python/libs/'

    def download_files(self):
        print("Downloading components")
        base.download(urljoin(maven_base_url, 'jans-config-api/plugins/admin-ui-plugin/{0}{1}/admin-ui-plugin-{0}{1}-distribution.jar'.format(app_versions['JANS_APP_VERSION'], app_versions['JANS_BUILD'])), self.admin_ui_plugin_source_path)
        base.download('https://raw.githubusercontent.com/JanssenProject/jans/{}/jans-config-api/server/src/main/resources/log4j2.xml'.format(app_versions['JANS_BRANCH']), self.log4j2_path)
        base.download('https://raw.githubusercontent.com/JanssenProject/jans/{}/jans-config-api/plugins/admin-ui-plugin/config/log4j2-adminui.xml'.format(app_versions['JANS_BRANCH']), self.log4j2_adminui_path)
        base.download('https://github.com/GluuFederation/flex/archive/refs/heads/{}.zip'.format(app_versions['FLEX_BRANCH']), self.flex_path)
        base.download('https://github.com/GluuFederation/casa/raw/gluu_cloud/extras/casa_web_resources.xml', self.casa_web_resources_fn)
        base.download('https://maven.gluu.org/maven/org/gluu/casa/{0}/casa-{0}.war'.format(app_versions['CASA_VERSION']), self.casa_war_fn)
        base.download('https://maven.gluu.org/maven/org/gluu/casa-config/{0}/casa-config-{0}.jar'.format(app_versions['CASA_VERSION']), self.casa_config_fn)
        base.download('https://repo1.maven.org/maven2/com/twilio/sdk/twilio/{0}/twilio-{0}.jar'.format(app_versions['TWILIO_VERSION']), self.twillo_fn)
        base.download('https://raw.githubusercontent.com/GluuFederation/casa/gluu_cloud/extras/Casa.py', self.casa_script_fn)
        base.download('https://raw.githubusercontent.com/GluuFederation/casa/gluu_cloud/extras/casa-external_fido2.py', os.path.join(self.casa_dist_dir, 'pylib/casa-external_fido2.py'))
        base.download('https://raw.githubusercontent.com/GluuFederation/casa/gluu_cloud/extras/casa-external_otp.py', os.path.join(self.casa_dist_dir, 'pylib/casa-external_otp.py'))
        base.download('https://raw.githubusercontent.com/GluuFederation/casa/gluu_cloud/extras/casa-external_super_gluu.py', os.path.join(self.casa_dist_dir, 'pylib/casa-external_super_gluu.py'))
        base.download('https://raw.githubusercontent.com/GluuFederation/casa/gluu_cloud/extras/casa-external_twilio_sms.py', os.path.join(self.casa_dist_dir, 'pylib/casa-external_twilio_sms.py'))
        base.download('https://raw.githubusercontent.com/GluuFederation/casa/gluu_cloud/extras/casa-external_u2f.py', os.path.join(self.casa_dist_dir, 'pylib/casa-external_u2f.py'))


    def install_gluu_admin_ui(self):

        print("Installing Gluu Admin UI Frontend")

        print("Extracting admin-ui from", self.flex_path)
        if os.path.exists(self.source_dir):
            os.rename(self.source_dir, self.source_dir+'-'+time.ctime().replace(' ', '_'))
        base.extract_from_zip(self.flex_path, 'admin-ui', self.source_dir)
        base.extract_from_zip(self.flex_path, 'flex-linux-setup/flex_linux_setup', self.flex_setup_dir)

        print("Source directory:", self.source_dir)
        env_tmp = os.path.join(self.source_dir, '.env.tmp')
        print("env_tmp", env_tmp)
        config_api_installer.renderTemplateInOut(env_tmp, self.source_dir, self.source_dir)
        config_api_installer.copyFile(os.path.join(self.source_dir, '.env.tmp'), os.path.join(self.source_dir, '.env'))
        config_api_installer.run([paths.cmd_chown, '-R', 'node:node', self.source_dir])
        cmd_path = 'PATH=$PATH:{}/bin:{}/bin'.format(Config.jre_home, Config.node_home)

        for cmd in ('npm install @openapitools/openapi-generator-cli', 'npm run api', 'npm install', 'npm run build:prod'):
            print("Executing `{}`".format(cmd))
            run_cmd = '{} {}'.format(cmd_path, cmd)
            config_api_installer.run(['/bin/su', 'node','-c', run_cmd], self.source_dir)

        target_dir = os.path.join(httpd_installer.server_root, 'admin')

        print("Copying files to", target_dir)
        config_api_installer.copyTree(os.path.join(self.source_dir, 'dist'), target_dir)

        config_api_installer.check_clients([('role_based_client_id', '2000.')])
        config_api_installer.renderTemplateInOut(self.admin_ui_config_properties_path, os.path.join(self.flex_setup_dir, 'templates'), config_api_installer.custom_config_dir)
        admin_ui_plugin_path = os.path.join(config_api_installer.libDir, os.path.basename(self.admin_ui_plugin_source_path))
        config_api_installer.web_app_xml_fn = os.path.join(config_api_installer.jetty_base, config_api_installer.service_name, 'webapps/jans-config-api.xml')
        config_api_installer.copyFile(self.admin_ui_plugin_source_path, config_api_installer.libDir)
        config_api_installer.add_extra_class(admin_ui_plugin_path)

        for logfn in (self.log4j2_adminui_path, self.log4j2_path):
            config_api_installer.copyFile(logfn, config_api_installer.custom_config_dir)


    def install_casa(self):


        jans_auth_dir = os.path.join(Config.jetty_base, jansAuthInstaller.service_name)
        jans_auth_custom_lib_dir = os.path.join(jans_auth_dir, 'custom/libs')

        print("Adding twillo and casa config to jans-auth")
        self.copyFile(self.casa_config_fn, jans_auth_custom_lib_dir)
        self.copyFile(self.twillo_fn, jans_auth_custom_lib_dir)
        class_path = '{},{}'.format(
            os.path.join(jans_auth_custom_lib_dir, os.path.basename(self.casa_config_fn)),
            os.path.join(jans_auth_custom_lib_dir, os.path.basename(self.twillo_fn)),
            )
        xml_fn = os.path.join(jans_auth_dir, 'webapps', jansAuthInstaller.service_name+'.xml')
        jansAuthInstaller.add_extra_class(class_path, xml_fn)

        simple_auth_scr_inum = 'A51E-76DA'
        print("Enabling script", simple_auth_scr_inum)
        self.dbUtils.enable_script(simple_auth_scr_inum)

        # copy casa scripts
        if not os.path.exists(self.py_lib_dir):
            os.makedirs(self.py_lib_dir)
        for fn in glob.glob(os.path.join(self.casa_dist_dir, 'pylib/*.py')):
            print("Copying", fn, "to", self.py_lib_dir)
            self.copyFile(fn, self.py_lib_dir)

        # prepare casa scipt ldif
        casa_auth_script_fn = os.path.join(self.templates_dir, 'casa_person_authentication_script.ldif')
        base64_script_file = self.generate_base64_file(self.casa_script_fn, 1)
        Config.templateRenderingDict['casa_person_authentication_script'] = base64_script_file
        self.renderTemplateInOut(casa_auth_script_fn, self.templates_dir, self.source_dir)

        Config.templateRenderingDict['casa_redirect_uri'] = 'https://{}/casa'.format(Config.hostname)
        Config.templateRenderingDict['casa_redirect_logout_uri'] = 'https://{}/casa/bye.zul'.format(Config.hostname)
        Config.templateRenderingDict['casa_frontchannel_logout_uri'] = 'https://{}/casa/autologout'.format(Config.hostname)
        Config.templateRenderingDict['casa_web_port'] = '8080'

        self.casa_client_fn = os.path.join(self.source_dir, 'templates/casa_client.ldif')
        self.casa_config_fn = os.path.join(self.source_dir, 'templates/casa_config.ldif')
        self.service_name = 'casa'

        self.check_clients([('casa_client_id', '3000.')])

        print(Config.casa_client_id)
        print(Config.casa_client_encoded_pw)
        print(Config.casa_client_pw)

        print("Importing LDIF Files")

        self.renderTemplateInOut(self.casa_client_fn, self.templates_dir, self.source_dir)
        self.renderTemplateInOut(self.casa_config_fn, self.templates_dir, self.source_dir)
        self.dbUtils.import_ldif([
                os.path.join(self.source_dir, os.path.basename(self.casa_client_fn)),
                os.path.join(self.source_dir, os.path.basename(self.casa_config_fn)),
                os.path.join(self.source_dir, os.path.basename(casa_auth_script_fn)),
                ])


        Config.installCasa = True

        self.copyFile(os.path.join(self.templates_dir, 'casa.default'), os.path.join(Config.templateFolder, 'jetty/casa'))

        self.jetty_app_configuration[self.service_name] = {
                    "memory": {
                        "max_allowed_mb": 1024,
                        "metaspace_mb": 128,
                        "jvm_heap_ration": 0.7,
                        "ratio": 0.1
                        },
                    "jetty": {
                        "modules": "server,deploy,resources,http,http-forwarded,console-capture,jsp,cdi-decorate"
                    },
                    "installed": False,
                    "name": self.service_name
                }


        print("Calculating application memory")

        installedComponents = []

        # Jetty apps
        for config_var, service in [('installOxAuth', 'jans-auth'),
                                    ('installScimServer', 'jans-scim'),
                                    ('installFido2', 'jans-fido2'),
                                    ('installConfigApi', 'jans-config-api'),
                                    ('installEleven', 'jans-eleven'),
                                    ('installCasa', self.service_name),
                                    ]:

            if Config.get(config_var) and service in self.jetty_app_configuration:
                installedComponents.append(self.jetty_app_configuration[service])

        self.calculate_aplications_memory(Config.application_max_ram, self.jetty_app_configuration, installedComponents)

        print("Deploying casa as Jetty application")
        self.installJettyService(self.jetty_app_configuration[self.service_name], True)
        self.copyFile(os.path.join(self.templates_dir, 'casa.service'), '/etc/systemd/system')
        jetty_service_dir = os.path.join(Config.jetty_base, self.service_name)
        jetty_service_webapps_dir = os.path.join(jetty_service_dir, 'webapps')


        self.run([paths.cmd_mkdir, '-p', os.path.join(jetty_service_dir, 'static')])
        self.run([paths.cmd_mkdir, '-p', os.path.join(jetty_service_dir, 'plugins')])
        self.copyFile(self.casa_war_fn, jetty_service_webapps_dir)
        self.copyFile(self.casa_web_resources_fn, jetty_service_webapps_dir)
        self.run([paths.cmd_chown, '-R', '{0}:{0}'.format(Config.jetty_user), jetty_service_dir])
        gluu_python_dir = '/opt/gluu/python/'
        self.run([paths.cmd_mkdir, '-p', os.path.join(gluu_python_dir, 'libs')])
        self.run([paths.cmd_chown, '-R', '{0}:{0}'.format(Config.jetty_user), gluu_python_dir])


        print("Updating apache configuration")
        apache_directive_template_text = self.readFile(os.path.join(self.templates_dir, 'casa_apache_directive'))

        apache_directive_text = self.fomatWithDict(apache_directive_template_text, Config.templateRenderingDict)

        https_jans_text = self.readFile(httpd_installer.https_jans_fn)

        if not '<Location /casa>' in https_jans_text:

            https_jans_list = https_jans_text.splitlines()
            n = 0
    
            for i, l in enumerate(https_jans_list):
                if l.strip() == '</LocationMatch>':
                    n = i

            https_jans_list.insert(n+1, '\n' + apache_directive_text + '\n')
            self.writeFile(httpd_installer.https_jans_fn, '\n'.join(https_jans_list))
            httpd_installer.restart()

        self.enable()


def main():

    if not node_installer.installed():
        node_fn = 'node-{0}-linux-x64.tar.xz'.format(app_versions['NODE_VERSION'])
        node_path = os.path.join(Config.distAppFolder, node_fn)
        if not os.path.exists(node_path):
            print("Downloading", node_fn)
            base.download('https://nodejs.org/dist/{0}/node-{0}-linux-x64.tar.xz'.format(app_versions['NODE_VERSION']), node_path)
        print("Installing node")
        node_installer.install()

    installer_obj = flex_installer()
    installer_obj.download_files()

    installer_obj.install_gluu_admin_ui()

    if argsp.casa_integration:
        installer_obj.install_casa()
        config_api_installer.start('casa')
        config_api_installer.restart('jans-auth')

    print("Restarting Janssen Config Api")
    config_api_installer.restart()

    print("Installation was completed. Browse https://{}/admin".format(Config.hostname))

if __name__ == "__main__":
    main()

