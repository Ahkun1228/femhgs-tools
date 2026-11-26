// 共用：把書籤樹轉成 Chrome / Edge 可「匯入書籤」的 HTML（Netscape Bookmark 格式），並觸發下載。
// tree 格式：[{ title, children: [...] }, { title, href }, ...]
(function () {
  function h(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function nodeHtml(n, depth) {
    var pad = new Array(depth + 1).join('    ');
    if (n.children) {
      return pad + '<DT><H3>' + h(n.title) + '</H3>\n' +
        pad + '<DL><p>\n' +
        n.children.map(function (c) { return nodeHtml(c, depth + 1); }).join('') +
        pad + '</DL><p>\n';
    }
    return pad + '<DT><A HREF="' + h(n.href) + '">' + h(n.title) + '</A>\n';
  }

  window.buildBookmarksHtml = function (tree) {
    return '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n' +
      '<!-- This is an automatically generated file. -->\n' +
      '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n' +
      '<TITLE>Bookmarks</TITLE>\n' +
      '<H1>Bookmarks</H1>\n' +
      '<DL><p>\n' +
      tree.map(function (n) { return nodeHtml(n, 1); }).join('') +
      '</DL><p>\n';
  };

  window.countBookmarks = function (tree) {
    return tree.reduce(function (sum, n) {
      return sum + (n.children ? window.countBookmarks(n.children) : 1);
    }, 0);
  };

  window.downloadTextFile = function (filename, text) {
    var blob = new Blob([text], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  };
})();
