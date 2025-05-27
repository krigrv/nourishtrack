"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/detect-element-overflow";
exports.ids = ["vendor-chunks/detect-element-overflow"];
exports.modules = {

/***/ "(ssr)/./node_modules/detect-element-overflow/dist/esm/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/detect-element-overflow/dist/esm/index.js ***!
  \****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ detectElementOverflow)\n/* harmony export */ });\nfunction getRect(element) {\n    return element.getBoundingClientRect();\n}\nfunction detectElementOverflow(element, container) {\n    return {\n        get collidedTop() {\n            return getRect(element).top < getRect(container).top;\n        },\n        get collidedBottom() {\n            return getRect(element).bottom > getRect(container).bottom;\n        },\n        get collidedLeft() {\n            return getRect(element).left < getRect(container).left;\n        },\n        get collidedRight() {\n            return getRect(element).right > getRect(container).right;\n        },\n        get overflowTop() {\n            return getRect(container).top - getRect(element).top;\n        },\n        get overflowBottom() {\n            return getRect(element).bottom - getRect(container).bottom;\n        },\n        get overflowLeft() {\n            return getRect(container).left - getRect(element).left;\n        },\n        get overflowRight() {\n            return getRect(element).right - getRect(container).right;\n        },\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZGV0ZWN0LWVsZW1lbnQtb3ZlcmZsb3cvZGlzdC9lc20vaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxLcmlzaG5hIEdhdXJhdlxcR2l0SHViXFxub3VyaXNodHJhY2tcXG5vZGVfbW9kdWxlc1xcZGV0ZWN0LWVsZW1lbnQtb3ZlcmZsb3dcXGRpc3RcXGVzbVxcaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gZ2V0UmVjdChlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG59XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZXRlY3RFbGVtZW50T3ZlcmZsb3coZWxlbWVudCwgY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0IGNvbGxpZGVkVG9wKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJlY3QoZWxlbWVudCkudG9wIDwgZ2V0UmVjdChjb250YWluZXIpLnRvcDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IGNvbGxpZGVkQm90dG9tKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJlY3QoZWxlbWVudCkuYm90dG9tID4gZ2V0UmVjdChjb250YWluZXIpLmJvdHRvbTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IGNvbGxpZGVkTGVmdCgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSZWN0KGVsZW1lbnQpLmxlZnQgPCBnZXRSZWN0KGNvbnRhaW5lcikubGVmdDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IGNvbGxpZGVkUmlnaHQoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmVjdChlbGVtZW50KS5yaWdodCA+IGdldFJlY3QoY29udGFpbmVyKS5yaWdodDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IG92ZXJmbG93VG9wKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJlY3QoY29udGFpbmVyKS50b3AgLSBnZXRSZWN0KGVsZW1lbnQpLnRvcDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IG92ZXJmbG93Qm90dG9tKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJlY3QoZWxlbWVudCkuYm90dG9tIC0gZ2V0UmVjdChjb250YWluZXIpLmJvdHRvbTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IG92ZXJmbG93TGVmdCgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSZWN0KGNvbnRhaW5lcikubGVmdCAtIGdldFJlY3QoZWxlbWVudCkubGVmdDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0IG92ZXJmbG93UmlnaHQoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmVjdChlbGVtZW50KS5yaWdodCAtIGdldFJlY3QoY29udGFpbmVyKS5yaWdodDtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/detect-element-overflow/dist/esm/index.js\n");

/***/ })

};
;