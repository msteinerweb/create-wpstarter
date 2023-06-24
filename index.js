#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

const targetDirArg = process.argv[2] || 'wpstarter';
const TARGET_DIR = path.join(process.cwd(), targetDirArg);

const CLONE_DIR = TARGET_DIR;
const CONFIG_FILE = path.join(CLONE_DIR, 'config.js');
const STORED_CONFIG_DIR = path.join(os.homedir(), '.wpstarter');
const STORED_CONFIG_FILE = path.join(STORED_CONFIG_DIR, 'config.json');

// Repository URL
const REPO_URL = 'https://github.com/msteinerweb/wpstarter.git';

// Check if required tools are installed
checkIfInstalled('mysql', 'MySQL client');
checkIfInstalled('git', 'Git');
checkIfInstalled('php', 'PHP');
checkIfInstalled('wp', 'WP-CLI');

// if directory already exists with files, exit
if (fs.existsSync(TARGET_DIR) && fs.readdirSync(TARGET_DIR).length > 0) {
    console.error(chalk.redBright(`\n\nThe directory ${targetDirArg} already exists and is not empty. Please choose a different directory or delete the existing one.\n`));
    process.exit(1);
}

// set up the greeting box
const greeting = chalk.greenBright('🚀  WELCOME TO THE WPSTARTER INSTALLER\n\n') +
    chalk.white('    We\'ll be installing the new site in the following directory:\n') +
    chalk.yellow(`    >> ${TARGET_DIR}\n\n`) +
    chalk.white('    Press Ctrl+C to stop.');
console.log(boxen(greeting, {
    padding: 1,
    borderColor: 'white',
    margin: 0,
    borderStyle: 'bold'
}));

function shell(cmd, cwd) {
    execSync(cmd, { stdio: 'ignore', cwd: cwd });
}

let storedConfig = {
    dbUser: '',
    dbPass: '',
    dbHost: '',
    adminUser: '',
    adminPassword: '',
    adminEmail: '',
    recommendedPlugins: [
        {
            name: 'Yoast SEO',
            slug: 'wordpress-seo',
            enabled: true,
        },
        {
            name: 'Jetpack',
            slug: 'jetpack',
            enabled: false,
        },
        {
            name: 'WooCommerce',
            slug: 'woocommerce',
            enabled: false,
        },
    ]
};

if (fs.existsSync(STORED_CONFIG_FILE)) {
    storedConfig = { ...storedConfig, ...JSON.parse(fs.readFileSync(STORED_CONFIG_FILE)) };
}

async function promptForConfiguration() {
    const questions = [
        {
            name: 'siteTitle',
            type: 'input',
            message: 'Enter the site title:',
            default: 'Website Title'
        },
        {
            name: 'blogDescription',
            type: 'input',
            message: 'Enter the blog description:',
            default: 'Just another WordPress site'
        },
        {
            name: 'themeName',
            type: 'input',
            message: 'Enter the theme name:',
            default: 'WPStarter',
        },
        {
            name: 'dbName',
            type: 'input',
            message: 'Enter the database name:'
        },
        {
            name: 'dbUser',
            type: 'input',
            message: 'Enter the database user:',
            default: storedConfig.dbUser
        },
        {
            name: 'dbPass',
            type: 'password',
            message: 'Enter the database password:',
            default: storedConfig.dbPass
        },
        {
            name: 'dbHost',
            type: 'input',
            message: 'Enter the database host:',
            default: storedConfig.dbHost
        },
        {
            name: 'adminUser',
            type: 'input',
            message: 'Enter the admin username:',
            default: storedConfig.adminUser
        },
        {
            name: 'adminPassword',
            type: 'password',
            message: 'Enter the admin password:',
            default: storedConfig.adminPassword
        },
        {
            name: 'adminEmail',
            type: 'input',
            message: 'Enter the admin email:',
            default: storedConfig.adminEmail
        },
        {
            name: 'plugins',
            type: 'checkbox',
            message: 'Select plugins to install:',
            choices: storedConfig.recommendedPlugins.map(plugin => ({ name: plugin.name, checked: plugin.enabled })),
        },
        {
            name: 'saveConfig',
            type: 'confirm',
            message: 'Would you like to save these settings for future projects?',
            default: true
        }
    ];

    return inquirer.prompt(questions);
}

async function configureProject() {
    try {

        // Prompt for configuration
        const answers = await promptForConfiguration();

        // Confirm the installation
        const confirmation = await inquirer.prompt([{
            type: 'confirm',
            name: 'continue',
            message: 'Are you sure you want to proceed with the installation?',
            default: true
        }]);

        if (!confirmation.continue) {
            console.log(chalk.yellow('\nInstallation cancelled by the user. Exiting...'));
            process.exit(0);
        }

        console.log('\n🚀 ' + chalk.cyanBright('Setting up your WordPress project...'));
        console.log(chalk.cyanBright('\nThis may take just a few minutes. Please wait...\n'));

        const spinnerClone = ora('Cloning the repository...').start();
        try {
            shell(`git clone ${REPO_URL} ${CLONE_DIR}`, process.cwd());
            spinnerClone.succeed('Repository cloned successfully!');
        } catch (error) {
            spinnerClone.fail('Failed to clone the repository.');
            throw error;
        }

        const spinnerInstall = ora('Installing dependencies for the npx script...').start();
        try {
            shell('npm install', process.cwd());
            spinnerInstall.succeed('Dependencies for the npx script installed successfully!');
        } catch (error) {
            spinnerInstall.fail('Failed to install dependencies for the npx script.');
            throw error;
        }

        if (fs.existsSync(CONFIG_FILE)) {

            const selectedPluginSlugs = storedConfig.recommendedPlugins.filter(plugin => answers.plugins.includes(plugin.name)).map(plugin => `'${plugin.slug}'`);

            let configContents = fs.readFileSync(CONFIG_FILE, 'utf8');
            configContents = configContents.replace(/config\.site\.title = '.*';/, `config.site.title = '${answers.siteTitle}';`)
                .replace(/config\.site\.blogdescription = '.*';/, `config.site.blogdescription = '${answers.blogDescription}';`)
                .replace(/config\.site\.theme_name = '.*';/, `config.site.theme_name = '${answers.themeName}';`)
                .replace(/config\.database\.dbname = '.*';/, `config.database.dbname = '${answers.dbName}';`)
                .replace(/config\.database\.dbuser = '.*';/, `config.database.dbuser = '${answers.dbUser}';`)
                .replace(/config\.database\.dbpass = '.*';/, `config.database.dbpass = '${answers.dbPass}';`)
                .replace(/config\.database\.dbhost = '.*';/, `config.database.dbhost = '${answers.dbHost}';`)
                .replace(/config\.site\.admin_user = '.*';/, `config.site.admin_user = '${answers.adminUser}';`)
                .replace(/config\.site\.admin_password = '.*';/, `config.site.admin_password = '${answers.adminPassword}';`)
                .replace(/config\.site\.admin_email = '.*';/, `config.site.admin_email = '${answers.adminEmail}';`)
                .replace(/config\.plugins = \[.*\];/s, `config.plugins = [${selectedPluginSlugs}];`);

            fs.writeFileSync(CONFIG_FILE, configContents);

            if (answers.saveConfig) {
                const newConfig = {
                    dbUser: answers.dbUser,
                    dbPass: answers.dbPass,
                    dbHost: answers.dbHost,
                    adminUser: answers.adminUser,
                    adminPassword: answers.adminPassword,
                    adminEmail: answers.adminEmail,
                    recommendedPlugins: storedConfig.recommendedPlugins.map(plugin => ({
                        ...plugin,
                        enabled: answers.plugins.includes(plugin.name)
                    }))
                };
                if (!fs.existsSync(STORED_CONFIG_DIR)) {
                    fs.mkdirSync(STORED_CONFIG_DIR);
                }
                fs.writeFileSync(STORED_CONFIG_FILE, JSON.stringify(newConfig, null, 2));
            }
        }

        const spinnerInstall2 = ora('Installing project dependencies...').start();
        try {
            shell('npm install', CLONE_DIR);
            spinnerInstall2.succeed('Project dependencies installed successfully!');
        } catch (error) {
            spinnerInstall2.fail('Failed to install project dependencies.');
            throw error;
        }

        const spinnerWpInstall = ora('Installing WordPress...').start();
        try {
            shell('npm run wpinstall', CLONE_DIR);
            spinnerWpInstall.succeed('WordPress installed successfully!');
        } catch (error) {
            spinnerWpInstall.fail('Failed to install WordPress.');
            throw error;
        }

        console.log('\n🎉 ' + chalk.greenBright('Your WordPress project has been successfully set up and is ready to go!'));
        console.log(chalk.cyanBright('\nTo start the development server, navigate to your project directory:'));
        console.log(chalk.yellowBright(`>> cd ${targetDirArg}\n`));
        console.log(chalk.cyanBright('And run the following command:'));
        console.log(chalk.yellowBright('>> npm run dev\n'));
        console.log(chalk.magentaBright('Happy coding! 🚀\n'));

    } catch (error) {
        console.log(chalk.red('\nAn error occurred during installation. Cleaning up...'));
        if (fs.existsSync(CLONE_DIR)) {
            fs.rmdirSync(CLONE_DIR, { recursive: true });
        }
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}

configureProject().catch(error => {
    console.error(error);
    process.exit(1);
});


function checkIfInstalled(command, name) {
    try {
        execSync(`${command} --version`, { stdio: 'ignore' });
    } catch (e) {
        console.error(`Error: ${name} is not installed.`);
        process.exit(1); // Stop the process if the tool is not installed
    }
}
