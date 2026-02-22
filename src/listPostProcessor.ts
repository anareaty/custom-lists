import CustomLists from "src/main";

export const registerCustomListsPostProcessor = (plugin: CustomLists) => {
    plugin.registerMarkdownPostProcessor((el, ctx) => {
        let items = el.findAll("li")
        for (let item of items) {
          plugin.updateListItem(item)
        }
    });
}



