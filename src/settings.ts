import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import CustomLists from "./main";
import { SvgSuggestModal } from './svgSuggestModal';
import { createColorMenu } from './colorMenu';


export interface CustomListsSettings {
    lists: any[]
    editorMenu: boolean
}

export const CL_DEFAULT_SETTINGS: CustomListsSettings = {
	lists: [],
    editorMenu: true
}


export class CustomListsSettingTab extends PluginSettingTab {
	plugin: CustomLists;

	constructor(app: App, plugin: CustomLists) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();


        for (let listObj of this.plugin.settings.lists) {

            let listSetting = new Setting(containerEl)
                listSetting
                .addButton(btn => btn
                    .setTooltip("Выбрать иконку")
                    .setIcon("image")
                    .onClick(() => {
                        new SvgSuggestModal(this.plugin, listObj, this).open()
                    })
                )

                .addButton(btn => btn
                    .setTooltip("Цвет иконки")
                    .setIcon("paintbrush")
                    .onClick((e) => {
                        createColorMenu(this.plugin, e, listObj, "iconColor", this)
                    })
                )

                .addButton(btn => btn
                    .setTooltip("Цвет текста")
                    .setIcon("type")
                    .onClick((e) => {
                        createColorMenu(this.plugin, e, listObj, "color", this)
                    })
                )

                .addButton(btn => btn
                    .setTooltip("Цвет фона")
                    .setIcon("paint-bucket")
                    .onClick((e) => {
                        createColorMenu(this.plugin, e, listObj, "background", this)
                    })
                )
            
                .addText(text => {
                    text.setPlaceholder("Символ")
                    .setValue(listObj.symbol)
                    .onChange((value) => {
                        let sameObj = this.plugin.settings.lists.find(c => c.symbol == value)
                        if (sameObj) {} else {
                            listObj.symbol = value
                            this.plugin.saveSettings()
                            this.plugin.updateAllLists()
                        }
                    })  
                    
                    text.inputEl.onblur = () => {
                        this.display()
                    }
                })


                .addText(text => {
                    text.setPlaceholder("Класс")
                    .setValue(listObj.customClass)
                    .onChange((value) => {
                        listObj.customClass = value
                        this.plugin.saveSettings()
                        this.plugin.updateAllLists()
                    })  
                    
                    text.inputEl.onblur = () => {
                        this.display()
                    }
                })


                listSetting.settingEl.classList.add("custom-list-setting")
                let customListIcon = listSetting.infoEl.createEl("span")
                customListIcon.classList.add("custom-list-line")
                customListIcon.classList.add("custom-list-line-setting")

                if (listObj.customClass) {
                    customListIcon.classList.add(listObj.customClass)
                }
                
                customListIcon.setCssProps({
                    "color": listObj.color,
                    "background-color": listObj.background,
                })
                let symbol = listObj.symbol
                if (!symbol) symbol = " "


                if (listObj.iconId) {

                    let iconSpan = document.createElement('span');
                    setIcon(iconSpan, listObj.iconId)
                    iconSpan.classList.add("custom-list-icon")
                    iconSpan.setCssProps({
                        "color": listObj.iconColor
                    })

                    customListIcon.append(iconSpan)
                    
                    customListIcon.append(" " + listObj.iconId)
                } else {
                    customListIcon.append("нет иконки")
                }

                
                
                listSetting
                .addButton(btn => btn
                    .setIcon("x")
                    .onClick(() => {
                        this.plugin.settings.lists = this.plugin.settings.lists.filter(c => c.symbol != listObj.symbol)
                        this.plugin.saveSettings()
                        this.display()
                        this.plugin.updateAllLists()
                    })
                )

            
        }

		new Setting(containerEl)
			.setName('Добавить элемент списка')
            .addButton(btn => btn
                .setIcon("plus")
                .onClick(() => {
                    let emptyObj = this.plugin.settings.lists.find(c => c.symbol == "")
                    if (!emptyObj) {
                        let listObj = {
                            symbol: "",
                            iconId: "",
                            iconColor: "",
                            color: "",
                            background: "",
                            customClass: ""
                        }
                        this.plugin.settings.lists.push(listObj)
                        this.plugin.saveSettings()
                        this.display()
                    }
                    
                })
            )

        

        
			
	}
}


