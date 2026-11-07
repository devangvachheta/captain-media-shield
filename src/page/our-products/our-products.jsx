import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import './our-products.scss';

const LogoCaptainWidgetsKit = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 255 244" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M228.344 59.0205C214.655 36.4941 193.992 18.9588 169.437 9.02878C144.882 -0.901239 117.749 -2.69425 92.0827 3.91705C66.4164 10.5284 43.5916 25.1899 27.0106 45.7161C10.4297 66.2422 0.980734 91.5337 0.0722376 117.82C-0.836259 144.107 6.8444 169.981 21.9692 191.585C37.0941 213.189 58.8531 229.367 84.0026 237.706C109.152 246.045 136.345 246.099 161.529 237.86C186.712 229.621 208.536 213.531 223.748 191.987L190.143 168.642C180.005 183 165.46 193.723 148.677 199.214C131.894 204.704 113.771 204.668 97.0107 199.111C80.25 193.553 65.749 182.772 55.6692 168.374C45.5894 153.976 40.4707 136.733 41.0762 119.215C41.6816 101.696 47.9788 84.8409 59.029 71.1614C70.0791 57.482 85.2905 47.711 102.396 43.305C119.5 38.8989 137.583 40.0939 153.948 46.7116C170.312 53.3294 184.082 65.0155 193.205 80.028L228.344 59.0205Z" fill={ color } />
        <path d="M109.784 161L89.8068 91.1819H105.932L117.489 139.693H118.068L130.818 91.1819H144.625L157.341 139.796H157.955L169.511 91.1819H185.636L165.659 161H151.273L137.977 115.352H137.432L124.17 161H109.784Z" fill={ color } />
        <path d="M194.068 161V91.1819H208.83V121.966H209.75L234.875 91.1819H252.568L226.659 122.443L252.875 161H235.216L216.091 132.296L208.83 141.159V161H194.068Z" fill={ color } />
    </svg>
);

const LogoCaptainFeedYouTube = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 103 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="capms-op-fy" style={ { maskType: 'luminance' } } maskUnits="userSpaceOnUse" x="0" y="0" width="90" height="100">
            <path d="M89.5467 24.1887C84.1784 14.9566 76.0753 7.76999 66.4459 3.70031C56.8165 -0.369367 46.1761 -1.10421 36.1109 1.60534C26.0456 4.31491 17.0947 10.3237 10.5924 18.7361C4.09008 27.1484 0.384603 37.5138 0.0283297 48.2869C-0.327943 59.0602 2.68408 69.6643 8.61537 78.5184C14.5467 87.3725 23.0796 94.0029 32.9422 97.4205C42.8047 100.838 53.4686 100.86 63.3447 97.4836C73.2204 94.107 81.7788 87.5127 87.7443 78.6832L74.5659 69.1156C70.5902 75 64.8863 79.3947 58.3047 81.6451C51.7231 83.8951 44.6161 83.8803 38.0434 81.6029C31.4706 79.325 25.7839 74.9066 21.8311 69.0057C17.8782 63.1049 15.8709 56.0381 16.1083 48.8586C16.3457 41.6787 18.8152 34.7709 23.1486 29.1645C27.482 23.5582 33.4473 19.5537 40.1553 17.7479C46.8627 15.9422 53.9541 16.4319 60.3718 19.1441C66.789 21.8563 72.189 26.6457 75.7667 32.7984L89.5467 24.1887Z" fill="white" />
        </mask>
        <g mask="url(#capms-op-fy)">
            <path d="M89.5467 24.1887C84.1784 14.9566 76.0753 7.76999 66.4459 3.70031C56.8165 -0.369367 46.1761 -1.10421 36.1109 1.60534C26.0456 4.31491 17.0947 10.3237 10.5924 18.7361C4.09008 27.1484 0.384603 37.5138 0.0283297 48.2869C-0.327943 59.0602 2.68408 69.6643 8.61537 78.5184C14.5467 87.3725 23.0796 94.0029 32.9422 97.4205C42.8047 100.838 53.4686 100.86 63.3447 97.4836C73.2204 94.107 81.7788 87.5127 87.7443 78.6832L74.5659 69.1156C70.5902 75 64.8863 79.3947 58.3047 81.6451C51.7231 83.8951 44.6161 83.8803 38.0434 81.6029C31.4706 79.325 25.7839 74.9066 21.8311 69.0057C17.8782 63.1049 15.8709 56.0381 16.1083 48.8586C16.3457 41.6787 18.8152 34.7709 23.1486 29.1645C27.482 23.5582 33.4473 19.5537 40.1553 17.7479C46.8627 15.9422 53.9541 16.4319 60.3718 19.1441C66.789 21.8563 72.189 26.6457 75.7667 32.7984L89.5467 24.1887Z" fill={ color } stroke={ color } strokeWidth="2" />
        </g>
        <path d="M66.3295 37H48.3678C46.5078 37 45 38.1411 45 39.5488V63.4512C45 64.8589 46.5078 66 48.3678 66C50.2278 66 51.7356 64.8589 51.7356 63.4512V54.0488H62.7371C64.5971 54.0488 66.1049 52.9077 66.1049 51.5C66.1049 50.0923 64.5971 48.9512 62.7371 48.9512H51.7356V42.0977H66.3295C68.1895 42.0977 69.6973 40.9565 69.6973 39.5488C69.6973 38.1411 68.1895 37 66.3295 37Z" fill={ color } />
        <path d="M89.5463 49.03L83.0987 37H76.1543L86.5277 55.174V67H92.4677V55.042L92.6351 54.754L89.5463 49.03ZM96.0911 37L91.5767 45.298L94.7195 51.13L102.846 37H96.0911ZM90.8963 46.54L90.2213 47.8L93.3317 53.554L94.0283 52.354L90.8963 46.54Z" fill={ color } />
    </svg>
);

const LogoCaptainMediaShield = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M89.5 24.2C84.2 15 76.1 7.8 66.4 3.7 56.8-.4 46.2-1.1 36.1 1.6 26 4.3 17.1 10.3 10.6 18.7 4.1 27.1.4 37.5 0 48.3c-.3 10.8 2.7 21.4 8.6 30.2 5.9 8.9 14.5 15.5 24.3 18.9 9.9 3.4 20.5 3.4 30.4.1 9.9-3.4 18.4-10 24.4-18.8L74.6 69.1c-4 5.9-9.7 10.3-16.3 12.5-6.6 2.3-13.7 2.3-20.3 0-6.6-2.3-12.3-6.7-16.2-12.6-4-5.9-6-13-5.7-20.1.2-7.2 2.7-14.1 7-19.7 4.3-5.6 10.3-9.6 17-11.4 6.7-1.8 13.8-1.3 20.2 1.4 6.4 2.7 11.8 7.5 15.4 13.7L89.5 24.2Z" fill={ color } />
        <path d="M66 36.5l-16-6-16 6v11c0 10.5 7 19.6 16 22 9-2.4 16-11.5 16-22v-11Z" fill={ color } />
        <path d="M43.5 49.5l5 5 9-10" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LogoCaptainSocialReview = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 104 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M89.5467 24.1887C84.1784 14.9566 76.0753 7.76999 66.4459 3.70031C56.8165 -0.369365 46.1761 -1.10421 36.1109 1.60534C26.0456 4.31491 17.0947 10.3237 10.5924 18.7361C4.09008 27.1484 0.384603 37.5138 0.0283296 48.2869C-0.327943 59.0602 2.68408 69.6643 8.61537 78.5184C14.5467 87.3725 23.0796 94.0029 32.9422 97.4205C42.8047 100.838 53.4686 100.86 63.3447 97.4836C73.2204 94.107 81.7788 87.5127 87.7443 78.6832L74.5659 69.1156C70.5902 75 64.8863 79.3947 58.3047 81.6451C51.7231 83.8951 44.6161 83.8803 38.0434 81.6029C31.4706 79.325 25.7839 74.9066 21.8311 69.0057C17.8782 63.1049 15.8709 56.0381 16.1083 48.8586C16.3457 41.6787 18.8152 34.7709 23.1486 29.1645C27.482 23.5582 33.4473 19.5537 40.1553 17.7479C46.8627 15.9422 53.9541 16.4319 60.3718 19.1441C66.789 21.8563 72.189 26.6457 75.7667 32.7984L89.5467 24.1887Z" fill={ color } />
        <path d="M62.1436 44.4648H66.2921C68.4931 44.4648 70.2765 42.8908 70.2765 40.9492C70.2765 39.0077 68.4931 37.4336 66.2921 37.4336H62.1436V44.4648Z" fill={ color } />
        <path d="M41.704 59.5376H45.8531V66.5688H41.704C36.5153 66.5688 36.7432 59.5376 41.704 59.5376Z" fill={ color } />
        <path d="M70.2712 57.5312C70.2425 62.1577 65.3847 66.5687 60.0409 66.5687H48.9909V59.5374H60.068C62.7625 59.5369 62.7848 55.5155 60.0409 55.5155H47.9762C42.1224 55.5155 37.1467 50.7826 37.7778 45.5757C38.3181 41.1183 42.8826 37.4312 47.9762 37.4312H59.0103V44.4624C59.0103 44.4624 47.9411 44.4624 47.9332 44.4624C45.0809 44.4624 45.1675 48.4843 47.9762 48.4843H60.0409C65.2636 48.4843 70.2993 52.9801 70.2712 57.5312Z" fill={ color } />
        <path d="M75 67V64.6474H76.5707C76.8941 64.6474 77.2267 64.6 77.55 64.4974C77.8734 64.4026 78.1598 64.1737 78.3908 63.8263C78.6218 63.4789 78.7327 62.9342 78.7327 62.2079V41.8316C78.7327 41.1053 78.6126 40.5684 78.3631 40.2132C78.1136 39.8658 77.818 39.6289 77.4761 39.5184C77.1343 39.4079 76.8294 39.3526 76.5707 39.3526H75V37H89.8014C92.878 37 95.3172 37.3158 97.1004 37.9474C98.8836 38.5789 100.177 39.4868 100.962 40.6789C101.748 41.8711 102.145 43.2921 102.145 44.9421C102.145 46.5921 101.877 47.8553 101.36 48.8895C100.833 49.9237 100.131 50.7447 99.2439 51.3447C98.3569 51.9447 97.3868 52.4026 96.3428 52.7105L101.064 61.0789C101.757 62.3421 102.367 63.25 102.912 63.8105C103.448 64.3711 104.048 64.6474 104.704 64.6474H105V67H103.078C101.508 67 100.075 66.9053 98.8004 66.7079C97.5254 66.5105 96.4352 66.1395 95.5297 65.5947C94.6243 65.05 93.9313 64.2605 93.4416 63.2184L89.1176 54.0605H87.0018V62.2158C87.0018 62.9421 87.085 63.4789 87.2513 63.8342C87.4176 64.1816 87.6486 64.4105 87.935 64.5053C88.2307 64.6 88.5725 64.6553 88.9698 64.6553H89.9492V67H75ZM88.8127 51.4947C90.4204 51.4947 91.5845 50.9737 92.3052 49.9395C93.0259 48.9053 93.3862 47.3737 93.3862 45.3605C93.3862 44.0184 93.2107 42.9211 92.8503 42.0842C92.49 41.2474 91.9633 40.6237 91.2796 40.2132C90.5959 39.8026 89.7274 39.6053 88.7204 39.6053H87.0018V51.4947H88.8127Z" fill={ color } />
        <path d="M96 24L97.6005 27.5796L102 27.9375L98.934 30.5625L99.867 34.5L96 32.3523L92.1333 34.5L93.0666 30.5625L90 27.9375L94.3999 27.5796L96 24Z" fill={ color } />
    </svg>
);

const LogoCaptainAdvanceFilter = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 106 102" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M94.5132 39.3623H74.4865C72.4126 39.3623 70.7314 40.3711 70.7314 41.6156V62.7467C70.7314 63.9912 72.4126 65 74.4865 65C76.5603 65 78.2415 63.9912 78.2415 62.7467V54.4345H90.5079C92.5817 54.4345 94.2629 53.4256 94.2629 52.1812C94.2629 50.9367 92.5817 49.9278 90.5079 49.9278H78.2415V43.8689H94.5132C96.5871 43.8689 98.2682 42.8601 98.2682 41.6156C98.2682 40.3711 96.5871 39.3623 94.5132 39.3623Z" fill={ color } />
        <mask id="capms-op-af" style={ { maskType: 'luminance' } } maskUnits="userSpaceOnUse" x="0" y="2" width="86" height="97">
            <path d="M85.9305 26.1733C80.779 17.314 73.0031 10.4176 63.7626 6.51231C54.522 2.60698 44.3113 1.90181 34.6526 4.50194C24.9938 7.10209 16.4044 12.8682 10.1646 20.9409C3.92491 29.0135 0.369071 38.9603 0.0271856 49.2983C-0.3147 59.6366 2.57569 69.8124 8.26745 78.309C13.9593 86.8055 22.1476 93.1682 31.6119 96.4477C41.0761 99.7272 51.3093 99.7483 60.7866 96.5083C70.2635 93.268 78.4763 86.94 84.2009 78.4671L71.5547 69.2859C67.7395 74.9327 62.266 79.1499 55.9501 81.3094C49.6343 83.4685 42.8143 83.4543 36.5071 81.2689C30.1997 79.083 24.7427 74.843 20.9495 69.1804C17.1562 63.5179 15.23 56.7365 15.4578 49.8469C15.6856 42.957 18.0554 36.3282 22.2138 30.9482C26.3722 25.5683 32.0966 21.7255 38.5337 19.9926C44.9702 18.2598 51.7752 18.7297 57.9338 21.3324C64.0918 23.9351 69.2738 28.5311 72.707 34.4353L85.9305 26.1733Z" fill="white" />
        </mask>
        <g mask="url(#capms-op-af)">
            <path d="M85.9305 26.1733C80.779 17.314 73.0031 10.4176 63.7626 6.51231C54.522 2.60698 44.3113 1.90181 34.6526 4.50194C24.9938 7.10209 16.4044 12.8682 10.1646 20.9409C3.92491 29.0135 0.369071 38.9603 0.0271856 49.2983C-0.3147 59.6366 2.57569 69.8124 8.26745 78.309C13.9593 86.8055 22.1476 93.1682 31.6119 96.4477C41.0761 99.7272 51.3093 99.7483 60.7866 96.5083C70.2635 93.268 78.4763 86.94 84.2009 78.4671L71.5547 69.2859C67.7395 74.9327 62.266 79.1499 55.9501 81.3094C49.6343 83.4685 42.8143 83.4543 36.5071 81.2689C30.1997 79.083 24.7427 74.843 20.9495 69.1804C17.1562 63.5179 15.23 56.7365 15.4578 49.8469C15.6856 42.957 18.0554 36.3282 22.2138 30.9482C26.3722 25.5683 32.0966 21.7255 38.5337 19.9926C44.9702 18.2598 51.7752 18.7297 57.9338 21.3324C64.0918 23.9351 69.2738 28.5311 72.707 34.4353L85.9305 26.1733Z" fill={ color } />
        </g>
        <path d="M42.0826 36L30 65H38.3189L40.7094 58.8246H50.9706L53.4993 65H62L49.5588 36H42.0826ZM43.1657 52.5446L45.7639 45.8448L48.4135 52.5446H43.1657Z" fill={ color } />
    </svg>
);

const LogoCaptainLiveChat = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={ color } strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LogoCaptainFunnel = ( { color } ) => (
    <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" fill={ color } d="M77.6879 21.1958C70.2328 13.7319 60.3181 9.61961 49.7555 9.61523C27.9902 9.61523 10.2765 27.3285 10.2677 49.0996C10.2648 56.0591 12.0829 62.8527 15.5386 68.841L9.93652 89.3027L30.8696 83.8116C36.6375 86.9579 43.1311 88.616 49.7394 88.6179H49.756C71.5188 88.6179 89.2344 70.9032 89.2427 49.1312C89.2471 38.5798 85.1435 28.6592 77.6879 21.1958ZM49.7555 81.9492H49.7419C43.8528 81.9468 38.0771 80.3642 33.0373 77.3744L31.8394 76.6628L19.4174 79.9216L22.733 67.8104L21.9524 66.5686C18.6669 61.343 16.932 55.3033 16.935 49.102C16.9418 31.0064 31.6653 16.2844 49.7686 16.2844C58.535 16.2873 66.7756 19.7055 72.972 25.9092C79.1684 32.1129 82.5789 40.3589 82.576 49.1287C82.5682 67.2257 67.8457 81.9492 49.7555 81.9492ZM67.7581 57.3684C66.7717 56.8742 61.9207 54.4881 61.016 54.1583C60.1123 53.8291 59.4538 53.6651 58.7967 54.6525C58.1386 55.6398 56.2481 57.8626 55.6722 58.5206C55.0963 59.1792 54.5214 59.2618 53.5346 58.7677C52.5477 58.274 49.3688 57.2317 45.5999 53.8704C42.6671 51.2542 40.687 48.0232 40.1112 47.0359C39.5363 46.0476 40.1063 45.5651 40.544 45.0223C41.6121 43.6959 42.6816 42.3054 43.0104 41.6473C43.3397 40.9888 43.1748 40.4124 42.9277 39.9188C42.6816 39.4251 40.7084 34.5686 39.8865 32.5925C39.0849 30.6694 38.2722 30.9291 37.6662 30.899C37.0913 30.8703 36.4332 30.8644 35.7751 30.8644C35.1176 30.8644 34.0485 31.111 33.1439 32.0993C32.2397 33.0872 29.6911 35.4738 29.6911 40.3302C29.6911 45.1867 33.2265 49.8782 33.7197 50.5368C34.2129 51.1953 40.6773 61.1611 50.5745 65.4344C52.9286 66.4519 54.7661 67.0584 56.1994 67.5132C58.5632 68.2641 60.7135 68.1581 62.4138 67.9042C64.3097 67.6207 68.2508 65.5171 69.0738 63.2127C69.8957 60.9077 69.8957 58.9326 69.6486 58.5206C69.4025 58.1091 68.7445 57.8626 67.7581 57.3684Z" />
    </svg>
);

const IconDownload = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" />
    </svg>
);
const IconZap = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
    </svg>
);
const IconRetry = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" />
    </svg>
);
const IconExternal = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 17 7" /><path d="M8 7h9v9" />
    </svg>
);
const IconStar = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2.5 15.1 9l7.2.9-5.2 5 1.3 7.1L12 18.6 5.6 22l1.3-7.1-5.2-5L8.9 9z" />
    </svg>
);

const PRODUCTS = [
    {
        name: 'Captain Widgets Kit',
        Logo: LogoCaptainWidgetsKit,
        description: __( 'A powerful Elementor addon with 50+ creative widgets to build stunning WordPress websites without coding.', 'captain-media-shield' ),
        badge: __( 'Free', 'captain-media-shield' ),
        badgeType: 'free',
        url: 'https://wordpress.org/plugins/captain-widgets-kit/',
        rateUrl: 'https://wordpress.org/plugins/captain-widgets-kit/#reviews',
        slug: 'captain-widgets-kit',
    },
    {
        name: 'Captain Feed for YouTube',
        Logo: LogoCaptainFeedYouTube,
        description: __( 'Display highly customizable YouTube video feeds, channels, and playlists on your WordPress website.', 'captain-media-shield' ),
        badge: __( 'Free', 'captain-media-shield' ),
        badgeType: 'free',
        url: 'https://wordpress.org/plugins/captain-feed-for-youtube/',
        rateUrl: 'https://wordpress.org/plugins/captain-feed-for-youtube/#reviews',
        slug: 'captain-feed-for-youtube',
    },
    {
        name: 'Captain Media Shield',
        Logo: LogoCaptainMediaShield,
        description: __( 'All-in-one free Image & Video Optimizer, WebP/AVIF Converter, Video Compressor, and Server Storage Saver.', 'captain-media-shield' ),
        badge: __( 'Active', 'captain-media-shield' ),
        badgeType: 'active',
        url: 'https://wordpress.org/plugins/captain-media-shield/',
        rateUrl: 'https://wordpress.org/plugins/captain-media-shield/#reviews',
        isSelf: true,
    },
    {
        name: 'Captain Social Review',
        Logo: LogoCaptainSocialReview,
        description: __( 'Display stunning social reviews from Google, Facebook, Yelp, Trustpilot, Tripadvisor, and 6 more platforms, fetched live via official APIs.', 'captain-media-shield' ),
        badge: __( 'Free', 'captain-media-shield' ),
        badgeType: 'free',
        url: 'https://wordpress.org/plugins/captain-social-review/',
        rateUrl: 'https://wordpress.org/plugins/captain-social-review/#reviews',
        slug: 'captain-social-review',
    },
    {
        name: 'Captain Advance Filter',
        Logo: LogoCaptainAdvanceFilter,
        description: __( 'Add powerful multi-condition filtering (search, tags, categories, price range and more) to any WordPress list or archive.', 'captain-media-shield' ),
        badge: __( 'Free', 'captain-media-shield' ),
        badgeType: 'free',
        url: 'https://wordpress.org/plugins/captain-advance-filter/',
        rateUrl: 'https://wordpress.org/plugins/captain-advance-filter/#reviews',
        slug: 'captain-advance-filter',
    },
    {
        name: 'Captain Funnel',
        Logo: LogoCaptainFunnel,
        description: __( 'Build WhatsApp-powered chat funnels and click-to-chat buttons to turn website visitors into conversations and leads.', 'captain-media-shield' ),
        badge: __( 'Free', 'captain-media-shield' ),
        badgeType: 'free',
        url: 'https://wordpress.org/plugins/captain-funnel/',
        rateUrl: 'https://wordpress.org/plugins/captain-funnel/#reviews',
        slug: 'captain-funnel',
    },
    {
        name: 'Captain Live Chat',
        Logo: LogoCaptainLiveChat,
        description: __( 'Self-hosted live chat for WordPress with an AI agent, canned replies and full conversation history - no monthly subscription.', 'captain-media-shield' ),
        badge: __( 'Free', 'captain-media-shield' ),
        badgeType: 'free',
        url: 'https://wordpress.org/plugins/captain-live-chat/',
        rateUrl: 'https://wordpress.org/plugins/captain-live-chat/#reviews',
        slug: 'captain-live-chat',
    },
];

const OurProducts = () => {
    const theme = useSelector( ( state ) => state.theme );
    const logoColor = theme === 'dark' ? '#ffffff' : '#2271b1';

    return (
        <div className="capms-products-wrapper">
            <div className="capms-products-header">
                <h1 className="capms-products-title">{ __( 'Our Products', 'captain-media-shield' ) }</h1>
                <p className="capms-products-subtitle">{ __( 'Explore our collection of free WordPress plugins.', 'captain-media-shield' ) }</p>
            </div>

            <div className="capms-products-grid">
                { PRODUCTS.map( ( product, i ) => {
                    const LogoComp = product.Logo;
                    const isActive = product.badgeType === 'active';

                    return (
                        <div key={ i } className="capms-product-card">
                            <div className="capms-product-card-top">
                                <div className="capms-product-card-icon">
                                    <LogoComp color={ logoColor } />
                                </div>
                                <h3 className="capms-product-card-name">{ product.name }</h3>
                                <span className={ `capms-product-badge capms-product-badge--${ isActive ? 'active' : product.badgeType }` }>
                                    { isActive ? __( 'Active', 'captain-media-shield' ) : product.badge }
                                </span>
                            </div>
                            <p className="capms-product-card-desc">{ product.description }</p>
                            <div className="capms-product-card-actions">
                                <a
                                    href={ product.url }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="capms-product-card-cta"
                                >
                                    <IconDownload />
                                    { __( 'View on WordPress.org', 'captain-media-shield' ) }
                                </a>
                                <div className="capms-product-card-subactions">
                                    <a
                                        href={ product.rateUrl }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="capms-product-card-icon-btn"
                                        title={ __( 'Rate Plugin', 'captain-media-shield' ) }
                                        aria-label={ __( 'Rate Plugin', 'captain-media-shield' ) }
                                    >
                                        <IconStar />
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                } ) }
            </div>

            <div className="capms-products-support">
                <div className="capms-products-support-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <div className="capms-products-support-text">
                    <h3>{ __( 'Need Help?', 'captain-media-shield' ) }</h3>
                    <p>{ __( 'Open a support ticket on WordPress.org and our team will get back to you quickly.', 'captain-media-shield' ) }</p>
                </div>
                <a
                    href="https://wordpress.org/support/plugin/captain-media-shield/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="capms-products-support-btn"
                >
                    { __( 'Get Support', 'captain-media-shield' ) }
                </a>
            </div>
        </div>
    );
};

export default OurProducts;
