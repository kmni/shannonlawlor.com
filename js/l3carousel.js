;(function($){

  $.fn.l3Carousel = function(userOptions) {
    var carousel = this;
    carousel.settings = {};
    carousel.animationTimeout = 0;

    var carouselName = "l3c";
    var classSeparator = "-";
    var classPrefix = carouselName + classSeparator;

    var defaultOptions = {
      classCarousel: carouselName,
      classWrapper: classPrefix + "wrapper",
      classItemWrapper: classPrefix + "itemWrapper",
      classItem: classPrefix + "item",
      classActiveItem: classPrefix + "active",
      classDescription: classPrefix + "description",
      classMainImage: classPrefix + "mainImage",
      classThumbnails: classPrefix + "thumbnails",
      classThumbnailsItem: classPrefix + "thumbnailsItem",
      classThumbnailsItemWrapper: classPrefix + "thumbnailsItemWrapper",
      classThumbnailsImage: classPrefix + "thumbnailsImage",
      classThumbnailsWrapper: classPrefix + "thumbnailsWrapper",
      classThumbnailsControls: classPrefix + "thumbnailsControls",
      classMainImageControls: classPrefix + "mainImageControls",
      classNext: classPrefix + "next",
      classPrevious: classPrefix + "prev",

      controlsShow: true,
      controlsNextContent: "next",
      controlsPreviousContent: "prev",

      thumbnailsShow: true,

      resizeable: true,
      autoScroll: true,
      animationDuration: 1000,
      animationDelay: 3000,
      thumbnailsScrollSpeed: 1000,
      elementsInvolvedHeightSelector: "",
      elementsInvolvedWidthSelector: "",
      minimalImageWithDescriptionHeight: 300
    };


    var Init = function () {
      carousel.settings = $.extend(defaultOptions, userOptions);

      SetDomStructure();
      SetCarouselElements();

      if (carousel.settings.controlsShow) {
        CreateMainImageControls();
      }
      if (carousel.settings.thumbnailsShow) {
        CreateThumbnails();
      }
      if (carousel.settings.resizeable) {
        ResizeCarousel();
        $(window).on('resize', ResizeCarousel);
        $(window).on('orientationchange', ResizeCarousel);
      }
      if (carousel.settings.autoScroll) {
        carousel.animationTimeout = setTimeout(AutoAnimate, carousel.settings.animationDelay);
      }
    };

    var AutoAnimate = function () {
      var animateObjectsCount = carousel.$itemsToAnimate.length;
      var currentObjectIndex = carousel.$itemsToAnimate.filter('.'+carousel.settings.classActiveItem).index();
      var nextObjectIndex = (currentObjectIndex+1 == animateObjectsCount ? 0 : currentObjectIndex+1);
      AnimateToPosition(currentObjectIndex, nextObjectIndex);
    };
    var AnimateToPosition = function (fromIndex, toIndex) {
      clearTimeout(carousel.animationTimeout);
      carousel.$itemsToAnimate.stop(true, true);
      var $itemFrom = carousel.$itemsToAnimate.eq(fromIndex);
      var $itemTo = carousel.$itemsToAnimate.eq(toIndex);

      $itemTo.addClass(carousel.settings.classActiveItem);
      $itemFrom.removeClass(carousel.settings.classActiveItem);

      $itemFrom.fadeOut(carousel.settings.animationDuration, function(){
        $itemTo.fadeIn(carousel.settings.animationDuration, function(){
            if (carousel.settings.autoScroll) {
              clearTimeout(carousel.animationTimeout);
              carousel.animationTimeout = setTimeout(AutoAnimate, carousel.settings.animationDelay);
            }
          }
        );
      });
      if (carousel.settings.thumbnailsShow) {
        SetActiveThumbnail(toIndex);
        ScrollThumbnailsToCenterActive(toIndex);
      }
    };
    var MoveToPosition = function (fromIndex, toIndex) {
      clearTimeout(carousel.animationTimeout);
      carousel.$itemsToAnimate.stop(true, true);
      carousel.$itemsToAnimate.hide();
      carousel.$itemsToAnimate.eq(fromIndex).removeClass(carousel.settings.classActiveItem);
      carousel.$itemsToAnimate.eq(toIndex).addClass(carousel.settings.classActiveItem).show();

      if (carousel.settings.autoScroll) {
        clearTimeout(carousel.animationTimeout);
        carousel.animationTimeout = setTimeout(AutoAnimate, carousel.settings.animationDelay);
      }
      if (carousel.settings.thumbnailsShow) {
        SetActiveThumbnail(toIndex);
        ScrollThumbnailsToCenterActive(toIndex);
      }
    };

    var ResizeCarousel = function () {
      var $body = $('body');
      var windowHeight = window.innerHeight ? window.innerHeight : $body.innerHeight();
      var bodyHeightDifference = $body.outerHeight() - $body.height();

      var elementsInvolvedHeight = 0;
      var $involvedHeight = $(carousel.settings.elementsInvolvedHeightSelector);
      if ($involvedHeight.length) {
        $involvedHeight.each(function(){
          elementsInvolvedHeight = elementsInvolvedHeight + $(this).outerHeight(true);
        });
      }

      var elementsInvolvedWidth = 0;
      var $involvedWidth = $(carousel.settings.elementsInvolvedWidthSelector);
      if ($involvedWidth.length) {
        $involvedWidth.each(function(){
          elementsInvolvedWidth = elementsInvolvedWidth + $(this).outerWidth();
        });
      }

      var height = windowHeight - elementsInvolvedHeight;
      var widthDifference = parseInt(carousel.$carouselWrapper.attr('data-widthDifference'), 10) || 0;
      var heightDifference = parseInt(carousel.$carouselWrapper.attr('data-heightDifference'), 10) || 0;
      var paddingBottom = parseInt(carousel.$carouselWrapper.attr('data-paddingBottom'), 10) || 0;

      var thumbnailsHeight = 0;
      if (carousel.settings.thumbnailsShow) {
        var $thumbnailsWrapper = carousel.$carouselWrapper.find('.'+carousel.settings.classThumbnailsWrapper);
        var $thumbnails = $thumbnailsWrapper.find('.'+carousel.settings.classThumbnails);
        thumbnailsHeight = parseInt($thumbnailsWrapper.outerHeight(), 10);
        paddingBottom = paddingBottom+thumbnailsHeight;
        if (parseInt($thumbnails.width(), 10) > parseInt($thumbnailsWrapper.width(), 10)) {
          CreateThumbnailsControls($thumbnails);
        } else {
          RemoveThumbnailsControls($thumbnails);
        }
      }

      var wrapperHeight = height-heightDifference-thumbnailsHeight-bodyHeightDifference;
      if (wrapperHeight < carousel.settings.minimalImageWithDescriptionHeight) {
        wrapperHeight = carousel.settings.minimalImageWithDescriptionHeight;
      }
      carousel.$carouselWrapper.removeAttr('style');
      carousel.$carouselWrapper.css({
        height: wrapperHeight,
        paddingBottom: paddingBottom
      });

      if (carousel.settings.thumbnailsShow) {
        var activeItemIndex = carousel.find('.'+carousel.settings.classActiveItem).index();
        ScrollThumbnailsToCenterActive(activeItemIndex);
      }
      SetCarouselItemDimension(carousel.$items);
      SetDescriptionSize();
      ResizeMainImages();
    };
    var ResizeMainImages = function () {
      var carouselHeight = carousel.height();
      var carouselWidth = carousel.width();

      carousel.find('.'+carousel.settings.classMainImage).each(function(){
        var defaultHeight = parseInt($(this).attr('data-defaultHeight'), 10);
        var defaultWidth = parseInt($(this).attr('data-defaultWidth'), 10);
        var heightDifference = parseInt($(this).attr('data-heightDifference'), 10);
        var widthDifference = parseInt($(this).attr('data-widthDifference'), 10);
        var ratio = defaultWidth/defaultHeight;
        var descriptionHeight = parseInt($(this).parents('.' + carousel.settings.classItemWrapper).find('.'+carousel.settings.classDescription).attr('data-height'), 10) || 0;

        var maxWidth = carouselWidth - widthDifference;
        var maxHeight = carouselHeight - descriptionHeight - heightDifference;

        $(this).width(Math.round(maxHeight*ratio));
        $(this).height(Math.round(maxHeight));

        if (maxWidth < (maxHeight*ratio)) {
          $(this).width(Math.round(maxWidth));
          $(this).height(Math.round(maxWidth/ratio));
        }
      });

    };

    var CreateMainImageControls = function () {
      $('<a href="#" class="'+carousel.settings.classMainImageControls+' '+carousel.settings.classNext+'">'+carousel.settings.controlsNextContent+'</a>').insertBefore(carousel);
      $('<a href="#" class="'+carousel.settings.classMainImageControls+' '+carousel.settings.classPrevious+'">'+carousel.settings.controlsPreviousContent+'</a>').insertAfter(carousel);
      carousel.parent().find('.'+carousel.settings.classMainImageControls).on('click', HandleMainImageControls);
    };
    var HandleMainImageControls = function (event) {
      var animateObjectsCount = carousel.$itemsToAnimate.length;
      var currentObjectIndex = carousel.$itemsToAnimate.filter('.'+carousel.settings.classActiveItem).index();
      var animateToIndex = 0;
      if ($(this).hasClass(carousel.settings.classNext)) {
        animateToIndex = (currentObjectIndex+1 == animateObjectsCount ? 0 : currentObjectIndex+1);
      } else {
        animateToIndex = (currentObjectIndex-1 < 0 ? animateObjectsCount-1 : currentObjectIndex-1);
      }
      MoveToPosition(currentObjectIndex, animateToIndex);
      event.preventDefault();
    };

    var CreateThumbnails = function () {
      carousel.$carouselWrapper.append('<div class="'+carousel.settings.classThumbnailsWrapper+'" />');
      var $thumbnails = carousel.$carousel.clone();
      $thumbnails.removeAttr('class').addClass(carousel.settings.classThumbnails);
      $thumbnails.find('.'+carousel.settings.classDescription).remove();
      $thumbnails.find('.'+carousel.settings.classItemWrapper).each(function(){
        $(this).removeAttr('style');
        var isActive = false;
        if ($(this).hasClass(carousel.settings.classActiveItem)) {
          isActive = true;
        }
        $(this).removeAttr('class').addClass(carousel.settings.classThumbnailsItemWrapper);
        if (isActive) {
          $(this).addClass(carousel.settings.classActiveItem);
        }
        var $image = $(this).find('img');
        $image.removeAttr('style');
        $image.removeAttr('class').addClass(carousel.settings.classThumbnailsImage);
        $image.removeAttr('data-widthDifference');
        $image.removeAttr('data-heightDifference');
        var $imageParent = $image.parent();
        var parentContent = $imageParent.html();
        $imageParent.replaceWith('<a href="#" class="'+carousel.settings.classThumbnailsItem+'">'+parentContent+'</a>');
      });

      carousel.$carouselWrapper.find('.'+carousel.settings.classThumbnailsWrapper).html($thumbnails);
      var thumbnailsWidthSum = 0;
      $thumbnails.find('.'+carousel.settings.classThumbnailsImage).each(function(){
        var parentImageHeight = $(this).parent().height();
        var imageRatio = parseInt($(this).attr('data-defaultWidth'), 10) / parseInt($(this).attr('data-defaultHeight'), 10);
        var imageWidth = Math.round(parentImageHeight*imageRatio);
        $(this).css({
          width: imageWidth,
          height: parentImageHeight
        });
        thumbnailsWidthSum = thumbnailsWidthSum + $(this).parents('.'+carousel.settings.classThumbnailsItemWrapper).outerWidth();
      });
      $thumbnails.width(thumbnailsWidthSum);
      $thumbnails.find('.'+carousel.settings.classThumbnailsItem).on('click', HandleThumbnails);
    };
    var CreateThumbnailsControls = function ($thumbnails) {
      if (!carousel.$carouselWrapper.find('.'+carousel.settings.classThumbnailsControls).length) {
        $('<a href="#" class="'+carousel.settings.classThumbnailsControls+' '+carousel.settings.classNext+'">'+carousel.settings.controlsNextContent+'</a>').insertBefore($thumbnails);
        $('<a href="#" class="'+carousel.settings.classThumbnailsControls+' '+carousel.settings.classPrevious+'">'+carousel.settings.controlsPreviousContent+'</a>').insertAfter($thumbnails);
        $thumbnails.parent().find('.'+carousel.settings.classThumbnailsControls).on('click', HandleMainImageControls);
      }
    };
    var RemoveThumbnailsControls = function ($thumbnails) {
      $thumbnails.parent().find('.'+carousel.settings.classThumbnailsControls).remove();
    };
    var HandleThumbnails = function (event) {
      var toIndex = $(this).parent().index();
      var currentIndex = $(this).parents('.'+carousel.settings.classThumbnails).find('.'+carousel.settings.classActiveItem).index();
      if (toIndex != currentIndex) {
        MoveToPosition(currentIndex, toIndex);
      }
      event.preventDefault();
    };
    var ScrollThumbnailsToCenterActive = function (thumbnailIndex) {
      var $thumbnailsWrapper = carousel.$carouselWrapper.find('.'+carousel.settings.classThumbnailsWrapper);
      var $thumbnails = $thumbnailsWrapper.find('.'+carousel.settings.classThumbnails);
      var $thumbnailsItems = $thumbnails.children();
      var $activeItem = $thumbnailsItems.eq(thumbnailIndex);

      var activeItemWidth = $activeItem.outerWidth();
      var thumbnailsWrapperWidth = parseInt($thumbnailsWrapper.width(), 10);
      var thumbnailsWidth = parseInt($thumbnails.width(), 10);

      var minPosition = 0;
      var maxPosition = thumbnailsWidth-thumbnailsWrapperWidth;
      var activeItemPosition = $activeItem.position().left;
      var currentThumbnailsPosition = $thumbnails.position().left;
      var newThumbnailsPosition = Math.round(activeItemPosition-(thumbnailsWrapperWidth/2)+(activeItemWidth/2));

      if (newThumbnailsPosition > maxPosition) {
        newThumbnailsPosition = maxPosition;
      } else if (newThumbnailsPosition < minPosition) {
        newThumbnailsPosition = minPosition;
      } else if (thumbnailsWidth < thumbnailsWrapperWidth) {
        newThumbnailsPosition = minPosition;
      }

      if (thumbnailsWidth < thumbnailsWrapperWidth) {
        $thumbnails.css('left', minPosition);
      }
      if (Math.abs(currentThumbnailsPosition) != newThumbnailsPosition && thumbnailsWidth > thumbnailsWrapperWidth) {
        $thumbnails.stop();
        $thumbnails.animate({
          left: -newThumbnailsPosition
        });
      }

    };
    var SetActiveThumbnail = function (thumbnailIndex) {
      var $thumbnails = carousel.$carouselWrapper.find('.'+carousel.settings.classThumbnails);
      var $thumbnailsItems = $thumbnails.children();
      $thumbnailsItems.removeClass(carousel.settings.classActiveItem);
      $thumbnailsItems.eq(thumbnailIndex).addClass(carousel.settings.classActiveItem);
    };

    var SetDomStructure = function () {
      carousel.addClass(carousel.settings.classCarousel);
      carousel.wrap('<div class="'+carousel.settings.classWrapper+'" />');
      var $carouselWrapper = carousel.parent();
      var carouselWrapperBottomPadding = parseInt($carouselWrapper.css('padding-bottom').replace('px',''), 10);
      $carouselWrapper.attr("data-paddingBottom", carouselWrapperBottomPadding);
      $carouselWrapper.attr("data-widthDifference", $carouselWrapper.outerWidth() - $carouselWrapper.width());
      $carouselWrapper.attr("data-heightDifference", $carouselWrapper.outerHeight() - $carouselWrapper.height());
      carousel.children().each(function(index){
        $(this).addClass(carousel.settings.classItemWrapper);
        if (index == 0) {
          $(this).addClass(carousel.settings.classActiveItem);
        }
        $(this).html('<div class="'+carousel.settings.classItem+'">'+$(this).html()+'</div>');
        var $image = $(this).find('img');
        $image.addClass(carousel.settings.classMainImage);
        $image.attr('data-defaultWidth', $image.width());
        $image.attr('data-defaultHeight', $image.height());
        $image.attr('data-widthDifference', $image.outerWidth() - $image.width());
        $image.attr('data-heightDifference', $image.outerHeight() - $image.height());
        SetCarouselItemDimension($(this).children('.'+carousel.settings.classItem));
      });
    };
    var SetDescriptionSize = function () {
      carousel.$items.find('.'+carousel.settings.classDescription).each(function(){
        var $parent = $(this).parents('.'+carousel.settings.classItemWrapper);
        var descriptionHeight = $(this).outerHeight(true);
        if (!$parent.is(':visible')) {
          $parent.show();
          descriptionHeight = $(this).outerHeight(true);
          $parent.hide();
        }
        $(this).attr('data-height', descriptionHeight);
      });
    };
    var SetCarouselElements = function () {
      carousel.$carousel = carousel;
      carousel.$carouselWrapper = carousel.$carousel.parent();
      carousel.$items = carousel.find('.'+carousel.settings.classItem);
      carousel.$itemsWrapper = carousel.find('.'+carousel.settings.classItemWrapper);
      carousel.$itemsToAnimate = carousel.$itemsWrapper;
    };
    var SetCarouselItemDimension = function ($item) {
      var width = carousel.width();
      var height = carousel.height();
      $item.css({
        height: height,
        width: width
      });
    };


    Init();
  };

})(jQuery);
