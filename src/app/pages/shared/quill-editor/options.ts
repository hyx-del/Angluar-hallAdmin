export const defaultOptions = {
    placeholder: '请输入...',
    modules: {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image'],
                ['clean'],
            ],
        },
    },
    theme: 'snow',
}

export const defaultNotLinkOptions = {
    placeholder: '请输入...',
    modules: {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
                [{ 'color': [] }, { 'background': [] }],
                ['image'],
                ['clean'],
            ],
        },
    },
    theme: 'snow',
}