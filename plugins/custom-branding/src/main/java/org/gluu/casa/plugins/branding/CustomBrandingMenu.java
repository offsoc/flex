package org.gluu.casa.plugins.branding;

import org.gluu.casa.extension.navigation.MenuType;
import org.gluu.casa.extension.navigation.NavigationMenu;
import org.pf4j.Extension;

/**
 * An extension class implementing the {@link NavigationMenu} extension point. It allows to add a menu item to admins
 * dashboard navigation menu
 * @author jgomer
 */
@Extension
public class CustomBrandingMenu implements NavigationMenu {

    public String getContentsUrl() {
        return "admin/menu.zul";
    }

    public MenuType menuType() {
        return MenuType.ADMIN_CONSOLE;
    }

    public float getPriority() {
        return 0.1f;
    }

}
