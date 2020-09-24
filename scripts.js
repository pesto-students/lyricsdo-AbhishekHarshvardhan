const allId = {
  lyricsSearchForm: "lyrics-search-form",
  lyricsSearchInput: "lyrics-search-input",
  lyricsSearchResult: "lyrics-search-result",
  lyrics: "lyrics",
  showLyrics: "show-album-lyrics",
  albumModal: "album-modal",
  albumModalClose: "album-modal-close",
  searchResultTitle: "search-result-title",
  paginationLinks: "#pagination > .pagination > a",
};

const baseURL = "https://api.lyrics.ovh";
const searchEndPoint = baseURL + "/suggest";
const lyricsEndPoint = baseURL + "/v1";

let searchResultAll = [];
let searchResultPaginated = [];
let currentPage = 1;
const currentPageSize = 8;
const errorMsg = "Sorry, something went wrong, please try after sometimes";
const loaderMsg = "Please wait...";

const showAlbumLyricsBtn = document.querySelectorAll(`#${allId.showLyrics}`);
const albumModalCloseBtn = document.getElementById(allId.albumModalClose);
const albumModal = document.getElementById(allId.albumModal);

document
  .getElementById(allId.lyricsSearchForm)
  .addEventListener("submit", onLyricsSearch);

albumModalCloseBtn.addEventListener("click", function (e) {
  albumModal.style.display = "none";
});

showAlbumLyricsBtn.forEach(function (element) {
  element.addEventListener("click", function (e) {
    e.preventDefault();
    albumModal.style.display = "block";
  });
});

const get = (url) => {
  return fetch(url).then((resp) => resp.json());
};

function searchLyrics(searchTerm) {
  return asyncGet(searchEndPoint + `/${searchTerm}`);
}

function getLyrics(artist, title) {
  return asyncGet(lyricsEndPoint + `/${artist}/${title}`);
}

async function onLyricsSearch(e) {
  e.preventDefault();
  const searchTerm = e.target[allId.lyricsSearchInput].value;
  await renderSearchResultList(searchTerm);
}

async function renderSearchResultList(searchTerm) {
  if (!searchTerm) return;
  showLoader();
  const result = await searchLyrics(searchTerm);
  if (result.error) return showSearchError();
  searchResultAll = result.data.map((d) => resultTemplate(d));
  searchResultPaginated = paginate(
    searchResultAll,
    currentPage,
    currentPageSize
  );
  setActiveClassForPage(currentPage);
  renderPagedList();
  addListenerToResultLink();
  addListenerToPagination();
}

function showLoader() {
  document.getElementById(allId.lyricsSearchResult).innerHTML = loaderMsg;
}

function showSearchError() {
  document.getElementById(allId.lyricsSearchResult).innerHTML = errorMsg;
}

function addListenerToPagination() {
  document
    .querySelectorAll(allId.paginationLinks)
    .forEach((node) => node.addEventListener("click", onPageChange));
}

function renderPagedList() {
  document.getElementById(allId.lyricsSearchResult).innerHTML =
    countTemplate(searchResultPaginated.length, searchResultAll.length) +
    searchResultPaginated.join("");
}

function countTemplate(count, total) {
  return `<h3>Showing ${count} results out of ${total}</h3>` + `<br/>`;
}

function addListenerToResultLink() {
  document
    .querySelectorAll(`#${allId.searchResultTitle}`)
    .forEach((node) => node.addEventListener("click", onAlbumClick));
}

function onPageChange(e) {
  const page = e.target.getAttribute("data-page");
  searchResultPaginated = paginate(searchResultAll, page, currentPageSize);
  setActiveClassForPage(page);
  currentPage = page;
  renderPagedList();
  addListenerToResultLink();
}

function setActiveClassForPage(page) {
  document.getElementById("pagination").style.display = "flex";
  document.querySelectorAll(allId.paginationLinks).forEach((node) => {
    if (node.getAttribute("data-page") != page)
      node.removeAttribute("class", "active");
    else node.setAttribute("class", "active");
  });
}

function paginate(items, pageNumber, pageSize) {
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
}

function resultTemplate(d) {
  return `<div class="card">
              <div class="card-body">
                <div class="album">
                  <img src="${d.album.cover_small}" class="album-image"></img>
                  <div class="content">
                    <h3>${d.artist.name}</h3>
                    <p>${d.title}</p>
                  </div>
                </div>
                <a id="${allId.searchResultTitle}" data-artist="${d.artist.name}"
                data-title="${d.title_short}" class="btn-link" href="#">Show lyrics</a>
              </div>
            </div>`;
}

async function onAlbumClick(e) {
  e.preventDefault();
  albumModal.style.display = "block";
  const artist = e.target.getAttribute("data-artist");
  const title = e.target.getAttribute("data-title");
  await renderLyrics(artist, title);
}

async function renderLyrics(artist, title) {
  document.getElementById(allId.lyrics).innerHTML = loaderMsg;
  const { error, data } = await getLyrics(artist, title);
  document.getElementById(allId.lyrics).innerHTML =
    error || (data && data.replace(/\n/g, "<br>")) || errorMsg;
}

async function asyncGet(fn) {
  const result = { data: null, error: null };
  try {
    const response = await get(fn);
    result.data = response.error || response.lyrics || response.data;
  } catch (error) {
    result.error = error;
  }
  return result;
}
