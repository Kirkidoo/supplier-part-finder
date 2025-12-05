import * as ftp from 'basic-ftp';

async function checkFtp() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: "ftp.importationsthibault.com",
            user: "lpaqftp",
            password: "plmn7536",
        });

        console.log("Connected to FTP.");
        console.log("Listing files in root...");
        const list = await client.list();

        list.forEach(file => {
            console.log(`- ${file.name} (${file.size} bytes)`);
        });

    } catch (err) {
        console.error("FTP Error:", err);
    }
    client.close();
}

checkFtp();
