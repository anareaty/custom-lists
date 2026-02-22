//@ts-ignore
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import {
Decoration,
DecorationSet,
EditorView,
PluginSpec,
PluginValue,
ViewPlugin,
ViewUpdate,
WidgetType
} from '@codemirror/view';
import { setIcon, editorLivePreviewField } from 'obsidian';

import CustomLists from 'src/main';


export const registerCustomListExtension = (plugin: CustomLists) => {
    class IconWidget extends WidgetType {
        listObj: any
        constructor(listObj: any) {
            super()
            this.listObj = listObj
        }
        toDOM(view: EditorView): HTMLElement {
            let iconSpan = document.createElement('span');
            setIcon(iconSpan, this.listObj.iconId)
            iconSpan.classList.add("custom-list-icon")
            iconSpan.setCssProps({
                "color": this.listObj.iconColor
            })
            return iconSpan;
        }
    }



    class CustomListPlugin implements PluginValue {
        decorations: DecorationSet;
        view: EditorView

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }
    
      update(update: ViewUpdate) {
        //@ts-ignore
        if (update.docChanged || update.viewportChanged || update.transactions?.[0]?.annotations?.[0]?.value) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
    
      destroy() {}
    
      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        if (!view.state.field(editorLivePreviewField)) {return builder.finish();}
        let items = plugin.settings.lists
    
        for (let { from, to } of view.visibleRanges) {
          syntaxTree(view.state).iterate({
            from,
            to,
            enter(node: any) {
              if (node.type.name.startsWith('list')) {
                let listStr = view.state.doc.sliceString(node.from, node.to)

                for (let listObj of items) {
                  let symbol = listObj.symbol
                  if (!symbol) continue
                  if (listStr.startsWith(symbol + " ")) {
                    
                    builder.add(
                      node.from - 2,
                      node.from - 2,
                      Decoration.line({
                        attributes: {
                          class: "custom-list-line " + listObj.customClass,
                          style: "color: " + listObj.color + "; background-color: " + listObj.background
                        }
                      })
                    );

                    builder.add(
                      node.from,
                      node.from + symbol.length,
                      Decoration.replace({
                        widget: new IconWidget(listObj),
                      })
                    );
                  }
                }                
              }
            },
          });
        }
        return builder.finish();
      }
    }

    const pluginSpec: PluginSpec<CustomListPlugin> = {
        decorations: (value: CustomListPlugin) => value.decorations,
    };

    const customListPlugin = ViewPlugin.fromClass(
      CustomListPlugin,
      pluginSpec
    )

    plugin.registerEditorExtension([customListPlugin])
}


