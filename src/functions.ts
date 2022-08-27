export function youtube_parser(url: string) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.toString().match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}