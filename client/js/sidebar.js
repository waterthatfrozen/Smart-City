const SIDEBAR_LINK = [{
    heading: 'OVERVIEW',
    links: [{link: '/dashboard', text: 'System Overview' },
        { link: '/zone-overview', text: 'Zone Overview' },
        { link: '/illuminance-sensor', text: 'Illuminance Report' },
        { link: '/maps-view', text: 'Device Maps' }]
}, {
    heading: 'CONTROL',
    links: [{ link: '/per-device-control', text: 'Per Device Control' },
        { link: '/per-zone-control', text: 'Per Zone Control'}]
},{
    heading: 'IoT Sensors',
    links: [{ link: '/iot-sensors', text: 'Sensor Record' }]
},{
    heading: 'SYSTEM STATUS',
    links: [{ link: '/device-connection', text: 'Gateway Status'},
        { link: '#', text: 'Device Events' },
        { link: '/service-status',  text: 'CMS Services Status'}]
},{
    heading: 'ABOUT',
    links: [{ link: '/about-us', text: 'About Us' }]
}];

function sidebar_link(hreflink, text) {
    return '<li class="nav-item"><a class="nav-link py-0" href="' + hreflink + '">' + text + '</a></li>';
}

function sidebar_division(sidebar_heading, sidebar_links) {
    let sidebar_div =
        `<h6 class = "sidebar-heading d-flex justify-content-between align-items-center px-3 mt-3 text-muted">
            <span>${sidebar_heading}</span></h6>
            <ul class = "nav flex-column mb-0">`;
    for (const element of sidebar_links) {
        sidebar_div += sidebar_link(element.link, element.text);
    }
    sidebar_div += `</ul>`;
    return sidebar_div;
}

function footer() {
    return `
    <ul class="nav flex-column mt-3 justify-content-between">
        <li class="ms-3"><img src="https://graduateadmissions.siit.tu.ac.th/plugin/img/siitlogo.png" style="height: 20px;" alt="logo"></li>
        <li class="nav-item nav-link smallest-font text-muted">
        &copy; 2022 SIIT, Thammasat University. <br/> Supported by Thammasat University & Thailand Science Research and Innovation Fundamental Fund, TUFF19/2564 and TUFF24/2565<br/></span>
        </li>
    </ul>`;
}

function sidebar_main() {
    let navMenu = $("#sidebarMenu");
    for (const element of SIDEBAR_LINK) {
        navMenu.append(sidebar_division(element.heading, element.links));
    }
    navMenu.append(footer());
    $("header").html(`
        <span class="navbar-brand col-md-3 col-lg-2 px-3 mx-0 me-0">
            <a class="text-white text-decoration-none" href="/dashboard">Smart Lighting Dashboard</a>
        </span>
        <button class="navbar-toggler position-absolute d-md-none collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false"
            aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="form-control bg-dark text-white w-100" id="datetime-display">&nbsp;</div>
        <div class="navbar-nav">
            <div class="nav-item text-nowrap">
                <a class="nav-link px-3" href="/logout" id="sign-out">Sign out</a>
            </div>
        </div>
    `);
}

$(document).ready(sidebar_main);