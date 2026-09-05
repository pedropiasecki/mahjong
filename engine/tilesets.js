import { hashCode } from './hash.js';
export function isKyodaiImageSet(name) {
    return ['kyodai', 'kyodai-black'].includes(name);
}
export const KyodaiTileSets = [
    {
        name: 'Traditional',
        author: 'My Kyodai Mahjogn',
        source: 'engine/assets/images/traditional.jpg'
    },
    {
        name: 'Mahjong Platinum 2 Dark',
        author: 'Pavel Osharin',
        source: 'engine/assets/images/platinum2-dark.jpg'
    },
    {
        name: 'Mahjong Platinum 2 Red',
        author: 'Pavel Osharin',
        source: 'engine/assets/images/platinum2-red.jpg'
    },
    {
        name: 'Disney Princess',
        author: 'My Kyodai Mahjong',
        source: 'engine/assets/images/disney-princess.jpg'
    },
    {
        name: 'Teste2',
        author: 'eu',
        source: 'engine/assets/images/imagem2.png'
    },

];

function resolveImageUrl(url) {
    if (!url) return '';
    // If it's a full URL (http:// or https://) or base64 (data:), return as-is
    if (/^(https?:|data:|\/\/)/i.test(url)) {
        return url;
    }
    // For local relative paths like 'assets/images/imagem.jpg', ensure clean format
    return url.startsWith('/') ? url : '/' + url;
}

async function loadImage(tileSetUrl) {
    return new Promise((resolve, reject) => {
        const newImg = new Image();
        // Support cross-origin only for external HTTP/HTTPS links
        if (/^https?:/i.test(tileSetUrl)) {
            newImg.crossOrigin = 'anonymous';
        }
        newImg.addEventListener('load', () => {
            resolve(newImg);
        });
        newImg.addEventListener('error', error => {
            console.error(error);
            reject(new Error(`Image ${tileSetUrl} could not be loaded.`));
        });
        newImg.src = resolveImageUrl(tileSetUrl);
    });
}

export function buildTiles(tiles, imageID, rowHeight, colWidth) {
    let result = '';
    for (const [nr, row] of tiles.entries()) {
        const y = nr * rowHeight;
        for (const [col, id] of row.entries()) {
            const x = col * colWidth;
            result += `<svg preserveAspectRatio="xMidYMid slice" id="${id}" width="75" height="100" viewBox="${x} ${y} ${colWidth} ${rowHeight}"><use xlink:href="#${imageID}"></use></svg>`;
        }
    }
    return result;
}

function escapeAttributeValue(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export async function buildKyodaiSVG(tileSetUrl) {
    if (!tileSetUrl) {
        return '<svg><defs></defs></svg>';
    }
    const range = (start, end) => Array.from({ length: end }, (_, index) => index + start);
    const kyodai = [
        range(1, 9).map(nr => `do${nr}`),
        range(1, 9).map(nr => `ba${nr}`),
        range(1, 9).map(nr => `ch${nr}`),
        ['se_winter', 'se_spring', 'se_summer', 'se_fall', 'wi_north', 'wi_south', 'wi_east', 'wi_west'],
        ['fl_bamboo', 'fl_plum', 'fl_orchid', 'fl_chrysanthemum', 'dr_green', 'dr_white', 'dr_red']
    ].map(row => row.map(id => `t_${id}`));
    const kyodaiExtra = [
        range(1, 9).map(nr => `g${nr}`),
        range(10, 9).map(nr => `g${nr}`),
        range(1, 9).map(nr => `e${nr}`)
    ].map(row => row.map(id => `t_${id}`));

    const finalUrl = resolveImageUrl(tileSetUrl);
    const image = await loadImage(tileSetUrl);
    const rowHeight = image.height / 5;
    const colWidth = image.width / 9;
    const imageID = hashCode(tileSetUrl);
    const extraID = hashCode('kyodai-extra');
    return `<svg><defs>
<image id="${imageID}" xlink:href="${escapeAttributeValue(finalUrl)}" x="0" y="0" height="${image.height}" width="${image.width}"/>
<image id="${extraID}" xlink:href="/assets/svg/kyodai-extra.png" x="0" y="0" height="300" width="675"/>
${buildTiles(kyodai, imageID, rowHeight, colWidth)}
${buildTiles(kyodaiExtra, extraID, 100, 75)}
</defs></svg>
`;
}
