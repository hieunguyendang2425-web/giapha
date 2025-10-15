document.addEventListener('DOMContentLoaded', () => {
    /* ============================
     * DỮ LIỆU MẪU
     ============================ */
    const familyData = {
        id: "A", name: "Cao Đình A", year: "1929–2019", gender: "Nam",
        avatar: "https://placehold.co/60x60/2980b9/ffffff?text=A",
        spouse: { id: "C", name: "Nguyễn Thị C", year: "1930–...", gender: "Nữ", avatar: "https://placehold.co/60x60/f39c12/ffffff?text=C" },
        children: [
            {
                id: "V", name: "Cao Đình V", year: "1960", gender: "Nam",
                avatar: "https://placehold.co/60x60/2980b9/ffffff?text=V",
                spouse: { id: "H", name: "Nguyễn Thị H", year: "1962", gender: "Nữ", avatar: "https://placehold.co/60x60/f39c12/ffffff?text=H" },
                children: [
                    { id: "T", name: "Cao Đình T", year: "1989", gender: "Nam", avatar: "https://placehold.co/60x60/2980b9/ffffff?text=T" }
                ]
            },
            {
                id: "D", name: "Cao Thị D", year: "1972", gender: "Nữ",
                avatar: "https://placehold.co/60x60/f39c12/ffffff?text=D",
                spouse: { id: "L", name: "Lê C", year: "1970", gender: "Nam", avatar: "https://placehold.co/60x60/2980b9/ffffff?text=L" },
                children: [
                    { id: "G", name: "Lê G", year: "1995", gender: "Nữ", avatar: "https://placehold.co/60x60/f39c12/ffffff?text=G" }
                ]
            },
            {
                id: "J", name: "Cao Thị J", year: "1988", gender: "Nữ",
                avatar: "https://placehold.co/60x60/f39c12/ffffff?text=J"
            }
        ]
    };

    /* ============================
     * THIẾT LẬP GIAO DIỆN
     ============================ */
    const canvas = document.getElementById('treeCanvas');
    const svg = document.getElementById('treeSvg');

    const NODE_W = 150;
    const NODE_H = 60;
    const COUPLE_GAP = 20;
    const X_GAP = 50;
    const Y_GAP = 120;
    const PADDING = 40;
    const layoutNodes = [];

    /* ============================
     * HÀM ĐỆ QUY XÂY DỰNG CÂY
     ============================ */
    function calculateLayout(person, x, y) {
        const coupleWidth = person.spouse ? NODE_W * 2 + COUPLE_GAP : NODE_W;

        if (!person.children || person.children.length === 0) {
            layoutNodes.push({ person, x, y, width: coupleWidth, childrenLayouts: [] });
            return { width: coupleWidth, rootX: x };
        }

        let childrenLayouts = [];
        let childX = x;
        person.children.forEach((child, index) => {
            const childLayout = calculateLayout(child, childX, y + Y_GAP);
            childrenLayouts.push(childLayout);
            childX += childLayout.width + X_GAP;
        });

        const childrenTotalWidth = childX - X_GAP - x;
        const childrenCenterX = x + childrenTotalWidth / 2;
        const selfStartX = childrenCenterX - coupleWidth / 2;

        layoutNodes.push({ person, x: selfStartX, y, width: coupleWidth, childrenLayouts });
        return { width: Math.max(childrenTotalWidth, coupleWidth), rootX: selfStartX };
    }

    /* ============================
     * RENDER CÂY LÊN MÀN HÌNH
     ============================ */
    function renderLayout(shiftX) {
        let maxX = 0, maxY = 0;

        layoutNodes.forEach(node => {
            createPersonEl(node.person, node.x + shiftX, node.y);
            if (node.person.spouse)
                createPersonEl(node.person.spouse, node.x + NODE_W + COUPLE_GAP + shiftX, node.y);

            const right = node.x + shiftX + node.width;
            const bottom = node.y + NODE_H;
            if (right > maxX) maxX = right;
            if (bottom > maxY) maxY = bottom;
        });

        layoutNodes.forEach(node => {
            if (node.childrenLayouts.length > 0) drawConnections(node, shiftX);
        });

        canvas.style.width = `${maxX + PADDING}px`;
        canvas.style.height = `${maxY + PADDING}px`;
        svg.setAttribute('width', maxX + PADDING);
        svg.setAttribute('height', maxY + PADDING);
    }

    /* ============================
     * VẼ CÁC ĐƯỜNG NỐI
     ============================ */
    function drawConnections(node, shiftX) {
        const parentCenterX = node.x + shiftX + node.width / 2;
        const parentBottomY = node.y + NODE_H;
        const horizontalY = parentBottomY + Y_GAP / 2;

        drawPath(`M ${parentCenterX} ${parentBottomY} V ${horizontalY}`);

        const firstChild = node.childrenLayouts[0];
        const lastChild = node.childrenLayouts[node.childrenLayouts.length - 1];
        const x1 = firstChild.rootX + shiftX + firstChild.width / 2;
        const x2 = lastChild.rootX + shiftX + lastChild.width / 2;
        drawPath(`M ${x1} ${horizontalY} H ${x2}`);

        node.childrenLayouts.forEach(child => {
            const cx = child.rootX + shiftX + child.width / 2;
            drawPath(`M ${cx} ${horizontalY} V ${child.y}`);
        });

        // Đường nối vợ chồng
        if (node.person.spouse) {
            const sx1 = node.x + shiftX + NODE_W;
            const sy = node.y + NODE_H / 2;
            const sx2 = sx1 + COUPLE_GAP;
            drawPath(`M ${sx1} ${sy} H ${sx2}`);
        }
    }

    /* ============================
     * VẼ NODE
     ============================ */
    function createPersonEl(person, x, y) {
        const el = document.createElement('div');
        el.className = 'person-node ' + (person.gender === 'Nữ' ? 'female' : 'male');
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.position = 'absolute';
        el.innerHTML = `
            <img class="person-avatar" src="${person.avatar}" alt="${person.name}">
            <div class="person-info">
                <div class="person-name">${person.name}</div>
                <div class="person-year">${person.year}</div>
            </div>`;
        el.addEventListener('click', () => showDetails(person));
        canvas.appendChild(el);
    }

    function drawPath(d) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#666');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
    }

    /* ============================
     * HỘP THÔNG TIN
     ============================ */
    function showDetails(person) {
        const box = document.getElementById('memberDetailsBox');
        document.getElementById('detailName').textContent = person.name;
        document.getElementById('detailAvatar').src = person.avatar;
        document.getElementById('detailDoB').textContent = person.year;
        document.getElementById('detailGender').textContent = person.gender;
        document.getElementById('relSpouse').textContent = person.spouse ? person.spouse.name : '[Độc thân]';
        document.getElementById('relChildren').textContent = (person.children && person.children.length)
            ? person.children.map(c => c.name).join(', ') : '[Không có]';
        document.getElementById('detailBio').textContent = person.bio || 'Không có tiểu sử.';
        box.classList.add('active');
    }

    /* ============================
     * KHỞI TẠO
     ============================ */
    function buildTree() {
        canvas.innerHTML = '';
        svg.innerHTML = '';
        layoutNodes.length = 0;

        const layout = calculateLayout(familyData, 0, 0);
        const totalWidth = layout.width;
        const shiftX = (canvas.parentElement.clientWidth / 2) - (totalWidth / 2);
        renderLayout(shiftX);
    }

    buildTree();
    window.addEventListener('resize', buildTree);
});
