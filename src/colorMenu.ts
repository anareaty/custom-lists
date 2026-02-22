import { Menu, MenuItem, SettingTab } from "obsidian";
import PrettyPropertiesPlugin from "src/main";
import { ColorPickerModal } from "./colorPickerModal";


export const createColorMenu = (plugin: PrettyPropertiesPlugin, e: MouseEvent, listObj: any, type: string, settingTab: SettingTab) => {
    let colors = [
        "default",
        "accent",
        "red",
        "orange",
        "yellow",
        "green",
        "cyan",
        "blue",
        "purple",
        "pink"
    ];

  

    let menu = new Menu();

    for (let color of colors) {
        menu.addItem((item: MenuItem) => {
            item.setIcon("square");
            let listColor = ""

            if (color == "default") {
                listColor = ""
            } else if (color == "accent") {
                if (type == "background") {
                    listColor = "hsla(var(--color-accent-hsl), 0.15)"
                } else {
                    listColor = "var(--interactive-accent)"
                }
            } else {
                if (type == "background") {
                    listColor = "rgba(var(--color-" + color + "-rgb), 0.15)"
                } else {
                    listColor = "rgb(var(--color-" + color + "-rgb))"
                }
            }

            //@ts-ignore
            item.iconEl.style =
                "color: transparent; background-color: " + listColor + ";";
            item.setTitle(color)
            .onClick((e) => {
                listObj[type] = listColor
                plugin.saveSettings()
                plugin.updateAllLists()
                settingTab.display()
            })

            item.setChecked(listObj[type] == listColor)
            if (color == "default marker") {
                item.setChecked(listObj[type] == listColor || !listObj[type])
            }
        });
    }

    menu.addItem((item: MenuItem) => {
        item.setTitle("custom")
        item.setIcon("square");
        //@ts-ignore
        item.iconEl.classList.add("menu-item-custom-color")
        item.onClick(() => {
            new ColorPickerModal(plugin, listObj, type, settingTab).open()
        })
        //@ts-ignore
            item.setChecked(listObj[type].startsWith("#"))
    })
    
    menu.showAtMouseEvent(e)
}
