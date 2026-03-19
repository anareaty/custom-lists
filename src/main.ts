import { MarkdownView, Plugin, setIcon, moment, MenuItem, Platform, Editor, Menu } from 'obsidian';
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

		this.registerDomEvent(document, "click", (e) => {
		let target = e.target;
		if ((target instanceof HTMLElement || target instanceof SVGElement) && target.closest(".custom-list-icon")) {
			let iconSpan = target.closest(".custom-list-icon")
			let symbol = iconSpan?.getAttribute("data-symbol")
			//@ts-ignore
			let search = this.app.internalPlugins.getEnabledPluginById("global-search")
			if(search) {
				search.openGlobalSearch('"- ' + symbol + ' "');
				}
			}
		});









		this.addCommand({
			id: 'custom-list-insert',
			name: 'Добавить символ списка в строку под курсором',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let menu = new Menu()
				this.populateListInsertMenu(menu, editor)
				let cursor = editor.getCursor()
				if (!cursor) return
				//@ts-ignore
				let coords = editor.coordsAtPos(cursor)
				menu.showAtPosition({x: coords.left + 20, y: coords.top})
			},
		})


		this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor, view) => {
			menu.addItem(i => {
				i.setTitle("Добавить символ списка")
				.setIcon("help-circle")
				
				//@ts-ignore
				let sub = i.setSubmenu()

				this.populateListInsertMenu(sub, editor)
				return i
			})
		}))
	}

	onunload() {}




	async loadSettings() {
		this.settings = Object.assign({}, CL_DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	async populateListInsertMenu(menu: Menu, editor: Editor) {
		let lists = this.settings.lists;
		let cursor = editor.getCursor()
		if (!cursor) return
		let line = editor.getLine(cursor.line)
		let symbol = ""

		for (let list of lists) {
			if (line.trimStart().startsWith("- " + list.symbol + " ")) {
				symbol = list.symbol
				break
			}
		}

		let checkboxMatch = line.trimStart().match(/^- (\[.\]) .*/)

		for (let list of lists) {
			menu.addItem(
				(item: MenuItem) => {
				item.setChecked(symbol == list.symbol)
				.setTitle(list.name || list.symbol)
				.setIcon(list.iconId);
				//@ts-ignore
				item.iconEl.setCssProps({
					"color": list.iconColor
				});
				//@ts-ignore
				item.dom.setCssProps({
					"color": list.color,
					"background-color": list.background
				});
				//@ts-ignore
				item.dom.classList.add("custom-list-menu-item");
				item.onClick(() => {
					let newLine = line
					if (checkboxMatch) {
						newLine = line.replace(checkboxMatch[1], list.symbol)
						cursor.ch = cursor.ch - 3 + list.symbol.length
					} else if (symbol) {
						newLine = line.replace(symbol, list.symbol)
						cursor.ch = cursor.ch - symbol.length + list.symbol.length
					} else if (line.trimStart().startsWith("- ")) {
						newLine = line.replace("- ", "- " + list.symbol + " ")
						cursor.ch = cursor.ch + 1 + list.symbol.length
					} else {
						newLine = "- " + list.symbol + " " + line
						cursor.ch = cursor.ch + 3 + list.symbol.length
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				});
				return item;
				}
			)
		}

		if (!checkboxMatch) {
			menu.addItem(item => item
				.setTitle("Задача")
				.setIcon("circle")
				.onClick(() => {
					let newLine = line
					if (symbol) {
						newLine = line.replace(symbol, "[ ]")
						cursor.ch = cursor.ch - symbol.length + 3
					} else if (line.trimStart().startsWith("- ")) {
						newLine = line.replace("- ", "- [ ] ")
						cursor.ch = cursor.ch + 4
					} else {
						newLine = "- [ ] " + line
						cursor.ch = cursor.ch + 6
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				})
			)
		}


		if (symbol || checkboxMatch || !line.trimStart().startsWith("- ")) {
			menu.addItem(item => item
				.setTitle("Список")
				.setIcon("dot")
				.onClick(() => {
					let newLine = line
					if (checkboxMatch) {
						newLine = line.replace(checkboxMatch[1] + " ", "")
						cursor.ch = cursor.ch - 4
					} else if (symbol) {
						newLine = line.replace(symbol + " ", "")
						cursor.ch = cursor.ch - symbol.length - 1
					} else {
						newLine = "- " + line
						cursor.ch = cursor.ch + 2
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				})
			)
		}
		

		if (symbol || checkboxMatch || line.trimStart().startsWith("- ")) {
			menu.addItem(item => item
				.setTitle("ОЧИСТИТЬ")
				.setIcon("x")
				.onClick(() => {
					let newLine = line
					if (checkboxMatch) {
						newLine = line.replace("- " + checkboxMatch[1] + " ", "")
						cursor.ch = cursor.ch - 6
					} else if (symbol) {
						newLine = line.replace("- " + symbol + " ", "")
						cursor.ch = cursor.ch - symbol.length - 3
					} else if (line.trimStart().startsWith("- ")) {
						newLine = line.replace("- ", "")
						cursor.ch = cursor.ch - 2
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				})
			)
		}
		
	}




	async updateListItem(list: HTMLElement) {

		let items = this.settings.lists
		let listContent = list.find("p")

		if (!listContent) {

			let firstNodeFound = false
			let childNodes = [...list.childNodes]
	  
			for (let node of childNodes) {
			  if (node instanceof HTMLElement && node.localName == "ul") {
				break
			  }
	  
			  if (node instanceof HTMLElement && (node.classList?.contains("list-bullet") || node.classList?.contains("list-collapse-indicator"))) {
				continue
			  }
	  
			  if (!firstNodeFound) {
				firstNodeFound = true
				listContent = document.createElement("p");
				node.before(listContent)
			  } 
			  
			  if (listContent) {
				listContent.append(node)
			  }
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

			listContent.className = ""
			list.removeAttribute("data-cls")
			
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
						

						if (listObj.customClass) {
							listContent.classList.add(listObj.customClass)
							list.setAttribute("data-cls", listObj.customClass)
						}


						if (listObj.background) {
							listContent.classList.add("bg-colored")
						}

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
		
		let items = document.querySelectorAll("li:not(.task-list-item")

		
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


