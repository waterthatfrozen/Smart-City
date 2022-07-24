const SIDEBAR_LINK = [{
    heading: 'OVERVIEW',
    links: [{
            link: '/dashboard',
            text: 'System Overview'
        },
        {
            link: '#',
            text: 'Zone Overview'
        },
        {
            link: '/maps-view',
            text: 'Device Maps'
        },
        {
            link: '/device-connection',
            text: 'Gateway and Sensor Status'
        },
        {
            link: '#',
            text: 'Device Events'
        },
        {
            link: '#',
            text: 'CMS System Status'
        }
    ]
}, {
    heading: 'CONTROL',
    links: [{
        link: '#',
        text: 'Set Dimming Value'
    }, {
        link: '#',
        text: 'Link 2'
    }, {
        link: '#',
        text: 'Link 3'
    }]
}];

function sidebar_link(hreflink, text) {
    return '<li class="nav-item"><a class="nav-link" href="' + hreflink + '">' + text + '</a></li>';
}

function sidebar_division(sidebar_heading, sidebar_links) {
    var sidebar_div =
        `<h6 class = "sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
            <span>${sidebar_heading}</span></h6>
            <ul class = "nav flex-column mb-auto">`;
    for (const element of sidebar_links) {
        sidebar_div += sidebar_link(element.link, element.text);
    }
    sidebar_div += `</ul>`;
    return sidebar_div;
}

function footer() {
    return `<ul class="nav flex-column mt-3 justify-content-between">
        <li class="nav-item nav-link smaller-font text-muted">
            &copy; 2022 Copyright Reserved.<br />
            SIIT, Thammasat University.<br />
            <a class="text-decoration-none text-muted" href="http://github.com/waterthatfrozen/">Project
                Information</a> |
            <a class="text-decoration-none text-muted" href="#">Privacy Statement</a>
        </li>
    </ul>`;
}

function main() {
    var navMenu = $("#sidebarMenu");
    for (const element of SIDEBAR_LINK) {
        navMenu.append(sidebar_division(element.heading, element.links));
    }
    navMenu.append(footer());
}

$(document).ready(main);