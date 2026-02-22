import { MarkdownView, Plugin, setIcon } from 'obsidian';
import { CustomListsSettingTab, CustomListsSettings, CL_DEFAULT_SETTINGS } from './settings';
import { registerCustomListExtension } from './listExtension';
import { registerCustomListsPostProcessor } from './listPostProcessor';




export default class CustomLists extends Plugin {
	settings: CustomListsSettings

	async onload() {
		await this.loadSettings();
		registerCustomListExtension(this)
		registerCustomListsPostProcessor(this)
		this.addSettingTab(new CustomListsSettingTab(this.app, this));
		this.updateAllLists()
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, CL_DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateListItem(list: HTMLElement) {
		let items = this.settings.lists
		let listContent = list.find("p")

		if (!listContent) {
			let listBareNode = [...list.childNodes].find(node => node.nodeType === Node.TEXT_NODE)
			if (listBareNode) {
				listContent = document.createElement("p")
				listBareNode?.before(listContent)
				listContent.append(listBareNode)
			}
		}
		
		if (listContent instanceof HTMLElement) {
			let oldIcon = listContent.find(".custom-list-icon")
			if (oldIcon) {
				let symbol = oldIcon.getAttribute("data-symbol")
				oldIcon.remove()
				listContent.prepend(symbol + " ")
			}

			listContent.setCssProps({
				"color": "",
				"background-color": "",
			})
			
			let listTextEl = listContent.firstChild
			if (listTextEl?.nodeType != Node.TEXT_NODE) return

			if (listTextEl) {
				let listText = listTextEl.textContent?.trimStart()
				if (!listText) return

				for (let listObj of items) {
					let symbol = listObj.symbol
					if (!symbol) continue

					if (listText.startsWith(symbol + " ")) {

						let iconSpan = document.createElement('span');
						setIcon(iconSpan, listObj.iconId)
						iconSpan.classList.add("custom-list-icon")
						iconSpan.setCssProps({
							"color": listObj.iconColor
						})
						iconSpan.setAttribute("data-symbol", symbol)
						listContent.prepend(iconSpan)
						

						listTextEl.textContent = listTextEl.textContent?.replace(symbol + " ", " ") || ""

						listContent.classList.add("custom-list-line")
						listContent.classList.add("custom-list-line-reading")

						listContent.setCssProps({
							"color": listObj.color,
							"background-color": listObj.background,
						})
						break
					}
				}
			}
		}
	}
	
	
	async updateAllLists() {
		let items = document.querySelectorAll("li")
		for (let item of items) {
			if (item instanceof HTMLElement) {
				this.updateListItem(item)
			}
		}

		this.app.workspace.iterateAllLeaves((leaf) => {
			let view = leaf.view
			if (view instanceof MarkdownView) {	
				let state = view.getState()
				if (state.mode == "source") {
					// @ts-expect-error, not typed
					const editorView = view.editor.cm as EditorView;
					editorView.dispatch({
						userEvent: "updateCustomLists"
					})
				}
			}
		})
	}
}


