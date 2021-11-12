import $ from "cash-dom";

for (const oneGroup of ['.skills-switch__tab', '.skills-group']) {
    $(oneGroup).each(function (index: number) {
        $(this).attr('data-index', String(index));
    });
}

$('.skills-switch__tab').on('click', function(event: Event) {
    event.preventDefault();
    $('.skills-switch__tab.active,.skills-group.active').removeClass('active');
    $(this).addClass('active');
    $(`.skills-group[data-index="${$(this).data('index')}"]`).addClass('active');
});
