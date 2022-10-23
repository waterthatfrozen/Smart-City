const SIDEBAR_LINK = [{
    heading: 'OVERVIEW',
    links: [{
            link: '/dashboard',
            text: 'System Overview'
        },
        {
            link: '/zone-overview',
            text: 'Zone Overview'
        },
        {
            link: '/illuminance-sensor',
            text: 'Illuminance Sensor Report'
        },
        {
            link: '/maps-view',
            text: 'Device Maps'
        }
    ]
}, {
    heading: 'CONTROL',
    links: [{
        link: '/set-dimming-value',
        text: 'Set Dimming Value'
    }]
},{
    heading: 'IoT Sensors',
    links: [{
        link: '/iot-sensors',
        text: 'Sensor Record'
    }]
},{
    heading: 'SYSTEM STATUS',
    links: [{
        link: '/device-connection',
        text: 'Gateway and Sensor Status'
    },
    {
        link: '/device-events',
        text: 'Device Events'
    },
    {
        link: '/service-status', 
        text: 'CMS Services Status'
    }]
}, {
    heading: 'Table & Graph',
    links: [{
        link: '/system-overview-t',
        text: 'System Overview_T'
    },
    {
        link: '/zone-overview-t',
        text: 'Zone Overview_T'
    },
    {
        link: '/illuminance-g', 
        text: 'Illuminance_G'
    },
    {
        link: '/disconnectlog-t', 
        text: 'DisconnectLog_T'
    },
    {
        link: '/export-csv', 
        text: 'Export_CSV'
    }]
}];

function sidebar_link(hreflink, text) {
    return '<li class="nav-item"><a class="nav-link py-1" href="' + hreflink + '">' + text + '</a></li>';
}

function sidebar_division(sidebar_heading, sidebar_links) {
    var sidebar_div =
        `<h6 class = "sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 text-muted">
            <span>${sidebar_heading}</span></h6>
            <ul class = "nav flex-column mb-0">`;
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
            <a class="text-decoration-none text-muted" href="http://github.com/waterthatfrozen/Smart-City">Project
                Information</a>
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