# ComfyUI Image Backend

Elevora AI uses ComfyUI as the open-source Stable Diffusion backend for Week 9 social image generation.

## Required Environment

```env
STABLE_DIFFUSION_BASE_URL=http://127.0.0.1:8188
COMFYUI_WORKFLOW_PATH=D:/elevora_projects/elevora-ai/elevora-ai-main/infra/comfyui/social-post-workflow.json
```

## API Rule

Use ComfyUI workflow API:

```text
POST http://127.0.0.1:8188/prompt
```

Do not use Automatic1111 endpoints such as `/sdapi/v1/txt2img`.

## Workflow Placeholder

Export a ComfyUI workflow JSON and place `{{PROMPT}}` in the text prompt field that Elevora should replace at runtime.

Instagram publishing needs a public image URL. Local ComfyUI output should be uploaded to MinIO or another public object URL before publishing to Instagram.
