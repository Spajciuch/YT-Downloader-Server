import * as express from "express"
import * as http from "http"
import * as path from "path"
import * as ytdl from "ytdl-core"
import * as fs from "fs"
import * as ffmpeg from "fluent-ffmpeg"

const socketio = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

import e = require("cors")

app.use(express.static("./public"))

app.get("/", (req, res) => {
    res.sendFile(path.resolve("./public/index.html"))
})

app.get("/audio/:fileName", (req, res) => {
    const rawPath = req.params.fileName
    const realPath = "/audio/" + rawPath
    const absolutePath = (__dirname + realPath).split("\\").join("/").replace("/dist", "");

    if (fs.existsSync(absolutePath)) {
        res.download(absolutePath)
    }
    else {
        res.json({ error: "File doesn't exists." });
    }

    res.status(200);
})

app.get("/video/:fileName", (req, res) => {
    const rawPath = req.params.fileName
    const realPath = "/video/" + rawPath
    const absolutePath = (__dirname + realPath).split("\\").join("/").replace("/dist", "");

    if (fs.existsSync(absolutePath)) {
        res.download(absolutePath)
    }
    else {
        res.json({ error: "File doesn't exists." });
    }

    res.status(200);
})

io.on("connection", (socket: any) => {
    console.log(`[socket.io] Socket connected`)

    socket.on("download", async (data: any) => {
        const id = ytdl.getURLVideoID(data.url)

        const info = await ytdl.getInfo(id)
        const stream = ytdl(data.url, { filter: 'audioandvideo', quality: 'highestvideo' })

        if (data.format == "mp3") {
            let audioPath = `./audio/${info.player_response.videoDetails.title}.mp3`
            audioPath = audioPath.split(`"`).join("'")
            audioPath = audioPath.split(`*`).join("")

            const command = ffmpeg({ source: stream })
            command.saveToFile(audioPath)

            command.on("end", () => { // Downloaded and converted to mp3
                const fileName = audioPath
                console.log("[ytdl] Download finished")
                socket.emit("downloadReady", fileName)
            })
        } else if (data.format == "mp4") {
            let videoPath = `./video/${info.player_response.videoDetails.title}.mp4`
            videoPath = videoPath.split(`"`).join("'")
            videoPath = videoPath.split(`*`).join("'")

            stream.pipe(fs.createWriteStream(videoPath).on("finish", () => {
                console.log("[ytdl] Download finished")
                socket.emit("downloadReady", videoPath)
            }))
        }
    })
})

const PORT = 5000
server.listen(PORT, () => console.log(`[server] Server available on ${PORT}`))