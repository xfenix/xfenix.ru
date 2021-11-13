import $ from "cash-dom";

// skills tabs
for (const oneGroup of ['.skills-switch__tab', '.skills-group']) {
    $(oneGroup).each(function (index: number) {
        $(this).attr('data-index', String(index));
    });
}

$('.skills-switch__tab').on('click', function(eventObj: Event) {
    eventObj.preventDefault();
    $('.skills-switch__tab.active,.skills-group.active').removeClass('active');
    $(this).addClass('active');
    $(`.skills-group[data-index="${$(this).data('index')}"]`).addClass('active');
});

// scrolls support
$('.top-head__menulink, .top-head__logolink').on('click', function (eventObj: Event) {
    eventObj.preventDefault();
    const originalHref: string = $(this).attr('href');
    window.scrollTo({
        top: originalHref.replace('#', '') ? $(originalHref).offset().top - $('.top-head').height() : 0,
        behavior: 'smooth'
    });
});
