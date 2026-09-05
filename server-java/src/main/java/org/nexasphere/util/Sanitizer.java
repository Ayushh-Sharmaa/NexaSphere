package org.nexasphere.util;

import org.springframework.web.util.HtmlUtils;

public final class Sanitizer {

    private Sanitizer() {
    }

    public static String clean(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim().replace("\u0000", "");
        return HtmlUtils.htmlEscape(trimmed);
    }
}
