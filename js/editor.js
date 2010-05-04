/**
 * Classe principal do editor
 *
 * @param {String} id 	   Id do textarea que ira virar o editor
 * @param {Object} options parametros de configuracao
 */
var Editor = function(id , options) {
    this.element   = null;
    this.options   = options || {};
    this.width     = this.options.width || "550px";
    this.height    = this.options.height || "350px";
    this.tools     = this.options.tools || Editor.Toolbar.Model.advanced;
    this.language  = this.options.language || 'pt_BR';
    this.id        = id;

    this.init();
}

Editor.prototype = {
    init: function(){
        this._initStructure();
        this._initToolbar();
        this._initEvents();
    },

    _initEvents: function(){
        $( this._getDoc()).bind("mouseup", {editor: this}, this.setElement);

        $('.pre-html input').bind("click", {editor: this}, function(event){
            var element = event.data.editor.getElement(),
                $textarea = $(this).prev().prev();

            $(element).append($textarea.val());
            $textarea.val('');
            $(this).parent().hide('fast');
            return false;
        });

        $('.pre-color a').bind("click", {editor: this}, function(event){
            event.data.editor._getWindow().focus();
            event.data.editor._execCommand("ForeColor", false, this.style.backgroundColor);

            $(this).parent().parent().parent().hide('fast');
            return false;
        });

        $('.pre-bgcolor a').bind("click", {editor: this}, function(event){
            event.data.editor._getWindow().focus();
            event.data.editor._execCommand(($.browser.msie)?("backcolor"):("hilitecolor"), false, this.style.backgroundColor);

            $(this).parent().parent().parent().hide('fast');
            return false;
        });
    },

    _initStructure: function(){
        var $main  = $('<div class="pre-main">'),
            $tool  = $('<div class="pre-tool">'),
            $code  = $('<div class="pre-code" style="display: none">'),
            $editor = $('<div class="pre-editor">'),
            $textarea = $('#'+this.id);

        this._createIframe();

        $textarea.before($main);

        $main.append($tool)
              .append($code)
              .append($editor)
              .css('width' , this.width);

        $code.append($textarea);

        $editor.before(Editor.Toolbar.Extra.html);
        $editor.before(Editor.Toolbar.Extra.color);
        $editor.before(Editor.Toolbar.Extra.bgcolor);
        $editor.append(this.iframe);

        var html = $('#'+this.id).val(),
            content = '<html><head></head><body>' + html + '</body></html>';

        this._getDoc().designMode = "On";
        this._getDoc().open();
        this._getDoc().write(content);
        this._getDoc().close();
    },

    _createIframe: function(){
        var $iframe = $('<iframe>');
        $iframe.css('border', '1px solid black')
               .css('margin', 0)
               .css('width' , this.width)
               .css('height', this.height)
               .attr('frameBorder',0)
               .attr('allowTransparency',true);
        this.iframe = $iframe;
    },

    _initToolbar: function(){
        this.toolbar = $('<div class="pre_editor_toolbar">');

        for(var i = 0;i < this.tools.length;i++) {
            if (Editor.Toolbar[this.tools[i]]) {
                this.addButton(this.tools[i], Editor.Toolbar[this.tools[i]]);
            } else {
                console.log(this.tools[i]);
            }
        }
        
        $('.pre-tool', this.iframe.parent().parent()).append(this.toolbar);
    },

    _getDoc: function() {
        return this.iframe[0].contentWindow.document;
    },

    _getWindow: function() {
        return this.iframe[0].contentWindow;
    },

    _getSelection: function() {
        if (this._getDoc() && this._getWindow()) {
            if (this._getDoc().selection) {
                return this._getDoc().selection;
            } else {
                return this._getWindow().getSelection();
            }
        }
        return false;
    },

    _getRange: function() {
        var sel = this._getSelection();

        if (sel == null) {
            return null;
        }

        if ($.browser.msie) {
            try {
                return sel.createRange();
            } catch (e) {
                return null;
            }
        }

        if (sel.rangeCount > 0) {
            return sel.getRangeAt(0);
        }
        return null;
    },

    _getSelectElement: function() {
        var rng = null,
            element = null,
            container = null;

        if ($.browser.msie) {
            if(this._getSelection().type.toLowerCase() === "control") {
                return this._getRange().item(0);
            }

            rng = this._getRange();
            if(!rng) {
                return false;
            }

            element = rng.parentElement();
            if(element.nodeName == "BODY" && this.hasSelection()) {
                return null;
            }
            return element;
        } else {
            rng = this._getRange();

            if(!rng) {
                return null;
            }

            container = rng.startContainer;

            if(container.nodeType === 3) {
                return container.parentNode;
            } else {
                return container;
            }
        }
        return null;
    },

    getEditorHTML: function() {
        return this._getDoc().body.innerHTML;
    },

    queryCommandValue: function(command) {
        this.iframe[0].contentWindow.focus();
        return this._getDoc().queryCommandValue(command);
    },

    _execCommand: function(command, flag, option) {
        try
        {
            this._getWindow().focus();
            this._getDoc().execCommand(command, flag || false, option || null);
            this._getWindow().focus();
        }catch(e){
            alert(e.message);
        }
    },

    setElement: function(event) {
        var element = event.data.editor._getSelectElement();
        if (element != null) {
            event.data.editor.element = element;
        }
    },

    getElement: function() {
        return this.element;
    },

    update: function() {
        var textarea = $('#'+this.id);
        textarea.val(this._getDoc().body.innerHTML);
    },

    refresh: function() {
        var textarea = $('#'+this.id);
        this._getDoc().body.innerHTML = textarea.val();
    },

    addButton: function(name, button)
    {
        var $link = $('<a>');

        if (!button.className) {
            button.className = 'pre_editor_' + name;
        }
        if (!button.title) {
            button.title = Editor.Translate[this.language][name];
        }
        if (!button.click) {
            button.click = function(event) {
                event.data.editor._execCommand(name);
            };
        }

        $link.attr('class', button.className + " pre_editor_button")
             .attr('href', '#')
             .attr('title', button.title)
             .html('&nbsp;')
             .bind('click', {editor: this}, function(event) {
                 button.click(event);
                 return false;
             });

        this.toolbar.append($link);
    }
}

Editor.Toolbar = {
    bold: {},
    italic: {},
    underline: {},
    justifyleft: {},
    justifycenter: {},
    justifyright: {},
    justifyfull: {},
    insertunorderedlist: {},
    insertorderedlist: {},
    indent: {},
    outdent: {},
    inserthorizontalrule: {},
    undo: {},
    redo: {},
    increaseFontSize: {
        click: function(event) {
            var editor = event.data.editor;
            if ($.browser.msie) {
                editor._execCommand("fontSize", false, editor.queryCommandValue("fontSize") + 1);
            } else if ($.browser.safari) {
                editor._getRange().surroundContents($(editor.iframe[0].contentWindow.document.createElement("span")).css("font-size", "larger")[0]);
            } else {
                editor._execCommand("increaseFontSize", false, "big");
            }
        }
    },
    decreaseFontSize: {
        click: function(event) {
            var editor = event.data.editor;
            if ($.browser.msie) {
                editor._execCommand("fontSize", false, editor.queryCommandValue("fontSize") - 1);
            } else if ($.browser.safari) {
                editor._getRange().surroundContents($(editor.iframe[0].contentWindow.document.createElement("span")).css("font-size", "smaller")[0]);
            } else {
                editor._execCommand("decreaseFontSize", false, "small");
            }
        }
    },
    removeFormat: {},
    createlink: {
        click: function(event) {
            var link = "http://",
                element = event.data.editor.getElement(),
                url = null;

            if (element && element.href) {
                link = element.href;
            }

            url = prompt("Endereço: ", link);

            if ((url != null) && (url != "")) {
                if (element && element.href) {
                    element.href = url;
                } else {
                    event.data.editor._execCommand("createlink", false, url);
                }
            } else {
                event.data.editor._execCommand("Unlink");
            }
        }
    },
    inserthtml: {
        click: function(event) {
            $('.pre-html', event.data.editor.iframe.parent().parent()).toggle('fast');
        }
    },
    color: {
        click: function(event) {
            $('.pre-color', event.data.editor.iframe.parent().parent()).toggle('fast');
        }
    },
    bgcolor: {
        click: function(event) {
            $('.pre-bgcolor', event.data.editor.iframe.parent().parent()).toggle('fast');
        }
    }
}

Editor.Toolbar.Extra = {
    html: '<div class="pre-html" style="display: none; clear: both;"><textarea cols="30" rows="5"></textarea><br /><input type="button" value="ok" /></div>',
    color: '<div class="pre-color" style="display: none; clear: both;"><ul class="item-list"><li><a href="#" style="border: 1px solid rgb(229, 210, 196); background-color: rgb(255, 216, 216);"></a></li><li><a href="#" style="border: 1px solid rgb(228, 209, 195); background-color: rgb(255, 234, 217);"></a></li><li><a href="#" style="border: 1px solid rgb(229, 218, 198); background-color: rgb(254, 242, 220);"></a></li><li><a href="#" style="border: 1px solid rgb(229, 221, 198); background-color: rgb(255, 245, 218);"></a></li><li><a href="#" style="border: 1px solid rgb(213, 228, 197); background-color: rgb(238, 254, 217);"></a></li><li><a href="#" style="border: 1px solid rgb(194, 228, 195); background-color: rgb(218, 254, 218);"></a></li><li><a href="#" style="border: 1px solid rgb(194, 230, 230); background-color: rgb(216, 255, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(194, 223, 231); background-color: rgb(217, 247, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(190, 211, 230); background-color: rgb(213, 235, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(214, 195, 227); background-color: rgb(238, 216, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(229, 193, 229); background-color: rgb(254, 216, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(229, 229, 229); background-color: rgb(255, 255, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(231, 127, 128); background-color: rgb(254, 140, 140);"></a></li><li><a href="#" style="border: 1px solid rgb(231, 166, 124); background-color: rgb(254, 186, 141);"></a></li><li><a href="#" style="border: 1px solid rgb(229, 208, 125); background-color: rgb(255, 232, 139);"></a></li><li><a href="#" style="border: 1px solid rgb(230, 228, 125); background-color: rgb(255, 255, 141);"></a></li><li><a href="#" style="border: 1px solid rgb(187, 225, 126); background-color: rgb(208, 252, 141);"></a></li><li><a href="#" style="border: 1px solid rgb(126, 226, 128); background-color: rgb(142, 251, 142);"></a></li><li><a href="#" style="border: 1px solid rgb(126, 230, 229); background-color: rgb(139, 255, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(127, 207, 230); background-color: rgb(140, 232, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(125, 127, 230); background-color: rgb(139, 140, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(188, 125, 229); background-color: rgb(209, 140, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(228, 127, 229); background-color: rgb(255, 139, 254);"></a></li><li><a href="#" style="border: 1px solid rgb(174, 174, 174); background-color: rgb(204, 204, 204);"></a></li><li><a href="#" style="border: 1px solid rgb(228, 0, 1); background-color: rgb(255, 1, 3);"></a></li><li><a href="#" style="border: 1px solid rgb(232, 92, 0); background-color: rgb(255, 102, 0);"></a></li><li><a href="#" style="border: 1px solid rgb(228, 182, 0); background-color: rgb(255, 204, 1);"></a></li><li><a href="#" style="border: 1px solid rgb(229, 228, 0); background-color: rgb(255, 255, 1);"></a></li><li><a href="#" style="border: 1px solid rgb(134, 224, 4); background-color: rgb(150, 249, 8);"></a></li><li><a href="#" style="border: 1px solid rgb(3, 224, 5); background-color: rgb(7, 249, 5);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 228, 227); background-color: rgb(2, 254, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 184, 228); background-color: rgb(0, 204, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 0, 230); background-color: rgb(1, 0, 254);"></a></li><li><a href="#" style="border: 1px solid rgb(137, 0, 230); background-color: rgb(152, 1, 255);"></a></li><li><a href="#" style="border: 1px solid rgb(231, 0, 230); background-color: rgb(252, 1, 254);"></a></li><li><a href="#" style="border: 1px solid rgb(128, 128, 128); background-color: rgb(153, 153, 153);"></a></li><li><a href="#" style="border: 1px solid rgb(137, 1, 1); background-color: rgb(153, 0, 2);"></a></li><li><a href="#" style="border: 1px solid rgb(173, 109, 0); background-color: rgb(182, 80, 6);"></a></li><li><a href="#" style="border: 1px solid rgb(172, 110, 1); background-color: rgb(191, 121, 0);"></a></li><li><a href="#" style="border: 1px solid rgb(184, 146, 0); background-color: rgb(204, 165, 0);"></a></li><li><a href="#" style="border: 1px solid rgb(81, 134, 4); background-color: rgb(90, 150, 3);"></a></li><li><a href="#" style="border: 1px solid rgb(4, 133, 4); background-color: rgb(5, 149, 2);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 136, 134); background-color: rgb(0, 153, 151);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 109, 137); background-color: rgb(0, 121, 152);"></a></li><li><a href="#" style="border: 1px solid rgb(8, 74, 132); background-color: rgb(9, 83, 146);"></a></li><li><a href="#" style="border: 1px solid rgb(96, 22, 147); background-color: rgb(106, 25, 164);"></a></li><li><a href="#" style="border: 1px solid rgb(138, 0, 139); background-color: rgb(152, 1, 154);"></a></li><li><a href="#" style="border: 1px solid rgb(85, 85, 85); background-color: rgb(102, 102, 102);"></a></li><li><a href="#" style="border: 1px solid rgb(81, 0, 0); background-color: rgb(89, 1, 0);"></a></li><li><a href="#" style="border: 1px solid rgb(113, 73, 1); background-color: rgb(119, 53, 5);"></a></li><li><a href="#" style="border: 1px solid rgb(115, 73, 1); background-color: rgb(127, 80, 0);"></a></li><li><a href="#" style="border: 1px solid rgb(131, 102, 0); background-color: rgb(146, 115, 0);"></a></li><li><a href="#" style="border: 1px solid rgb(48, 79, 3); background-color: rgb(54, 88, 2);"></a></li><li><a href="#" style="border: 1px solid rgb(2, 81, 2); background-color: rgb(3, 89, 2);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 80, 79); background-color: rgb(1, 89, 90);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 66, 82); background-color: rgb(0, 72, 91);"></a></li><li><a href="#" style="border: 1px solid rgb(6, 49, 91); background-color: rgb(8, 55, 101);"></a></li><li><a href="#" style="border: 1px solid rgb(48, 1, 81); background-color: rgb(55, 1, 89);"></a></li><li><a href="#" style="border: 1px solid rgb(82, 0, 82); background-color: rgb(89, 0, 90);"></a></li><li><a href="#" style="border: 1px solid rgb(0, 0, 0); background-color: rgb(0, 0, 0);"></a></li></ul></div>',
    bgcolor: '<div class="pre-bgcolor" style="display: none; clear: both;"><ul class="item-list"><li><a href="#" style="background-color: rgb(255, 247, 0);"></a></li><li><a href="#" style="background-color: rgb(174, 255, 102);"></a></li><li><a href="#" style="background-color: rgb(255, 204, 102);"></a></li><li><a href="#" style="background-color: rgb(220, 176, 251);"></a></li><li><a href="#" style="background-color: rgb(176, 238, 251);"></a></li><li><a href="#" style="background-color: rgb(251, 189, 176);"></a></li><li><a href="#" style="background-color: rgb(255, 255, 255);"></a></li></ul></div>'
}

Editor.Toolbar.Model = {
    simple:["bold", "italic", "underline" , "createlink" , "color" , "bgcolor" , "undo" , "redo" ],
    main:["bold", "italic", "underline" , "createlink" , "undo" , "redo" , "justifyleft" , , "color" , "bgcolor" , "justifycenter" , "justifyright" , "justifyfull" ],
    advanced:["bold", "italic", "underline" , "createlink" , "undo" , "redo" , "color" , "bgcolor" , "justifyleft" , "justifycenter" , "justifyright" , "justifyfull" , "insertunorderedlist" , "insertorderedlist" , "indent" ,"outdent","inserthorizontalrule","inserthtml",'increaseFontSize','decreaseFontSize','removeFormat']
}

Editor.Translate = {
    pt_BR: {
        bold: 'Negrito',
        italic: 'Itálico',
        underline: 'Sublinhado',
        justifyleft: 'Alinhar a esquerda',
        justifycenter: 'Alinhar ao centro',
        justifyright: 'Alinhar a direita',
        justifyfull: 'Alinhar justificado',
        insertunorderedlist: 'Lista',
        insertorderedlist: 'Lista ordenada',
        indent: 'Avançar',
        outdent: 'Recuar',
        inserthorizontalrule: 'Linha Horizontal',
        undo: 'Voltar',
        redo: 'Avançar',
        increaseFontSize: 'Aumentar fonte',
        decreaseFontSize: 'Diminuir',
        removeFormat: 'Remover formatação',
        createlink: 'Criar link',
        inserthtml: 'Inserir HTML',
        color: 'Cor da texto',
        bgcolor: 'Cor do fundo'
    }
}
